import m from '../models';
import Emitter from 'events';
import Events from "./Events";

export class Member {
    constructor (from?) {
        if (!from)
            return;

        this.update(from);
    }

    _id: String;
    name: String;
    money: number;

    update(from) {
        this._id = from._id.toString();
        this.name = from.name;
        this.money = from.money;
    }
}

export class MembersHandler extends Emitter{
    members: Array<Member>;

    async init(): boolean {
        try {
            let rawMembers = await m.Member.find();
            this.members = rawMembers.map(rawMember => new Member(rawMember));
            return true;
        } catch (e) {
            console.error(`Failed to initialize MembersHandler`);
            console.error(e);
            return false;
        }
    }

    updateMember(member: Member) {
        let current = this.members.find(current => member._id === current._id);

        if (current != null)
            current.update(member);
        else
            this.members.push(member);

        this.emit(Events.Changed, this.toEvent());
    }

    dispose() {
        this.removeAllListeners();
    }

    toEvent() {
        return this.members;
    }
}