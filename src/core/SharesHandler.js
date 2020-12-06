import Emitter from 'events';
import Events from './Events';
import m from '../models';
import random from 'random';
import Distribution from './Distribution';

export class ShareOwner {
    constructor(from?) {
        if (!from)
            return;

        this.update(from);
    }

    _id: String;
    sharesCount: number = 0;

    update(from) {
        this._id = from._id.toString();

        if (from.sharesCount !== undefined)
            this.sharesCount = from.sharesCount;
    }
}

export class Share extends Emitter {
    constructor(from?) {
        super();

        if (!from)
            return;

        this.update(from);
    }

    _id: String;
    name: String;
    distribution: String;
    dispersion: number;
    price: number;
    count: number;
    owners: Array<ShareOwner>;

    get availableCount() {
        return this.count - this.owners.reduce((totalCount, owner) => totalCount + owner.sharesCount, 0);
    }

    update(from) {
        this._id = from._id?.toString();
        this.name = from.name;
        this.distribution = from.distribution;
        this.dispersion = from.dispersion;
        this.price = from.price;
        this.count = from.count;
        this.owners = from.owners ? from.owners : [];
        this.emit(Events.Changed);
    }

    updateOwner(owner: ShareOwner) {
        let current = this.owners.find(current => current._id === owner._id);

        if (owner.sharesCount === 0) {
            let index = this.owners.indexOf(current);

            if (index >= 0) {
                this.owners.splice(index, 1);
                this.emit(Events.Changed);
            }

            return;
        }

        if (current)
            current.update(owner);
        else
            this.owners.push(owner);

        this.emit(Events.Changed);
    }

    recomputePrice() {
        if (this.distribution === Distribution.Unit) {
            this.price += random.float(-this.dispersion, this.dispersion);
        } else if (this.distribution = Distribution.Binomial) {
            let n = Math.max(1000, this.dispersion);
            this.price += (random.binomial(n)() - n / 2) / n * this.dispersion * 2;
        } else {
            this.price += random.normal()() * this.dispersion / 3;
        }
        this.price = Math.round(this.price);
    }
}

export class SharesHandler extends Emitter {
    shares: Array<Share>;
    _recomputeIntervalId;

    async init(): boolean {
        try {
            let market = await m.Market.findOne();
            let rawShares = await m.Share.find();
            this.shares = rawShares.map(rawShare => {
                let share = new Share(rawShare);
                share.on(Events.Changed, () => {
                    this.emit(Events.Changed);
                });
                return share;
            });
            this._recomputeIntervalId = setInterval(() => {
                this.shares.forEach(share => {
                    share.recomputePrice();
                });
                this.emit(Events.Changed);
            }, market.recomputeDuration * 1000);
            return true;
        } catch (e) {
            return false;
        }
    }

    dispose() {
        if (this._recomputeIntervalId != null) {
            clearInterval(this._recomputeIntervalId);
            this._recomputeIntervalId = null;
        }

        if (this.shares != null)
            this.shares.forEach(share => share.removeAllListeners());

        this.removeAllListeners();
    }

    toEvent() {
        return this.shares;
    }
}