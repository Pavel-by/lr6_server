import Emitter from 'events';
import Events from './Events';

export class Waiter extends Emitter{
    _date: ?Date;
    _timeoutId;

    reset(date: Date) {
        this._clear();
        this._date = date;
        queueMicrotask(() => {
            this._reset();
        });
    }

    stop() {
        this._clear();
    }

    _reset() {
        this._clear();
        let diff = this._date - Date.now();

        if (diff <= 0) {
            this.emit(Events.Ready);
            return;
        }

        this._timeoutId = setTimeout(() => {
            this._timeoutId = null;
            this._reset();
        }, Math.min(diff, 60000));
    }

    _clear() {
        if (this._timeoutId != null) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
    }
}