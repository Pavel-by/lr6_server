import {SharesHandler, ShareOwner} from "./SharesHandler";
import {MembersHandler} from "./MembersHandler";
import m from '../models';
import {Waiter} from "./Waiter";
import Events from "./Events";

const MarketState = {
    Wait: 'Wait',
    Active: 'Active',
    Finished: 'Finished'
};

class Market {
    constructor(from?) {
        if (!from)
            return;

        this.update(from);
    }

    start: Date;
    end: Date;
    recomputeDuration: number;

    update(from) {
        this.start = new Date(from.start);
        this.end = new Date(from.end);
        this.recomputeDuration = from.recomputeDuration;
    }
}

class MarketService {
    static instance: MarketService = new MarketService();

    constructor() {
        this._waiter.on(Events.Ready, async () => {
            if (!await this._sharesHandler.init() || !await this._membersHandler.init()) {
                console.error(`Failed to start market`);
                this._state = MarketState.Finished;
                this._socket.emit(Events.OutMarket, this.toEvent());
                this._sharesHandler.dispose();
                this._membersHandler.dispose();
                this._sharesHandler = null;
                this._membersHandler = null;
                return;
            }

            this._state = MarketState.Active;
            this._market.start = new Date(Date.now());
            this._socket.emit(Events.OutMarket, this.toEvent());
            this._socket.emit(Events.OutShares, this._sharesHandler.toEvent());
            this._socket.emit(Events.OutMembers, this._membersHandler.toEvent());
            this._endWaiter.reset(this._market.end);
        });
        this._endWaiter.on(Events.Ready, async() => {
            this._state = MarketState.Finished;
            this._sharesHandler.dispose();
            this._membersHandler.dispose();
            this._socket.emit(Events.OutMarket, this.toEvent());
        });
    }

    _waiter = new Waiter();
    _endWaiter = new Waiter();
    _state = MarketState.Wait;
    _sharesHandler: SharesHandler;
    _membersHandler: MembersHandler;
    _market: Market;
    _socket;

    init(socket) {
        this._socket = socket;

        this._socket.on('connect', (socket) => {
            // info:
            // {
            //      shareId: String  // id of share
            //      memberId: String
            //      sharesCount: number
            // }
            socket.on(Events.InBuyShares, async (info: {shareId: String, memberId: String, sharesCount: number}) => {
                try {
                    if (this._state !== MarketState.Active) {
                        socket.emit(Events.OutError, 'Аукцион неактивен.');
                        return;
                    }

                    let share = this._sharesHandler.shares.find(share => share._id === info.shareId);
                    let owner = share.owners.find(owner => owner._id === info.memberId);
                    let member = this._membersHandler.members.find(member => member._id === info.memberId);

                    if (member == null) {
                        console.error(`Failed to find member with id ${userId}`);
                        return;
                    }

                    if (owner == null) {
                        owner = new ShareOwner({
                            _id: member._id,
                            sharesCount: 0
                        });
                    }

                    if (info.sharesCount > share.availableCount) {
                        socket.emit(Events.OutError, 'Нет доступного количества акций.');
                        return;
                    }

                    if (info.sharesCount * share.price > member.money) {
                        socket.emit(Events.OutError, 'Недостаточно средств на балансе.');
                        return;
                    }

                    if (info.sharesCount < 0 && Math.abs(info.sharesCount) > owner.sharesCount) {
                        socket.emit(Events.OutError, `Для продажи доступно только ${owner.sharesCount} акций.`);
                        return;
                    }

                    owner.sharesCount += info.sharesCount;
                    member.money -= info.sharesCount * share.price;

                    share.updateOwner(owner);
                    this._membersHandler.updateMember(member);
                } catch (e) {
                    console.error(e);
                    socket.emit(Events.OutError, 'Неизвестная ошибка');
                }
            });

            socket.on(Events.InRefreshMarket, () => {
                this.reload();
            });

            socket.emit(Events.OutMarket, this.toEvent());

            if (this._state === MarketState.Active) {
                socket.emit(Events.OutShares, this._sharesHandler.toEvent());
                socket.emit(Events.OutMembers, this._membersHandler.toEvent());
            }
        });

        return this.reload();
    }

    async reload(): boolean {
        this._endWaiter.stop();
        this._state = MarketState.Wait;
        this._socket.emit(Events.OutMarket, this.toEvent());

        try {
            this._market = new Market(await m.Market.findOne());
        } catch (e) {
            console.error(`Failed to reload MarketService`);
            console.error(e);
            return false;
        }

        this._waiter.stop();
        this._sharesHandler?.dispose();
        this._membersHandler?.dispose();

        this._sharesHandler = new SharesHandler();
        this._membersHandler = new MembersHandler();

        if (this._market.end < Date.now()) {
            this._state = MarketState.Finished;
            this._socket.emit(Events.OutMarket, this.toEvent());
            return true;
        }

        this._sharesHandler.on(Events.Changed, () => {
           this._socket.emit(Events.OutShares, this._sharesHandler.toEvent());
        });
        this._membersHandler.on(Events.Changed, () => {
            this._socket.emit(Events.OutMembers, this._membersHandler.toEvent());
        });

        this._state = MarketState.Wait;
        this._socket.emit(Events.OutMarket, this.toEvent());
        this._waiter.reset(this._market.start);
        return true;
    }

    toEvent() {
        return {
            start: this._market?.start,
            end: this._market?.end,
            recomputeDuration: this._market?.recomputeDuration,
            state: this._state,
        };
    }
}

export {MarketState, MarketService};