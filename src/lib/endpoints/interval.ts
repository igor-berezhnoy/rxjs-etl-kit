import { Subscriber } from "rxjs";
import { GuiManager } from "../core";
import { EndpointGuiOptions, EndpointImpl } from "../core/endpoint";
import { EtlObservable } from "../core/observable";

export class IntervalEndpoint extends EndpointImpl<number> {
    protected static instanceNo = 0;
    protected interval: number;
    protected intervalId: NodeJS.Timer;
    protected counter: number = 0;
    protected subscriber: Subscriber<number>;
    
    constructor(interval: number, guiOptions: EndpointGuiOptions<number> = {}) {
        guiOptions.displayName = guiOptions.displayName ?? `Interval ${++IntervalEndpoint.instanceNo}(${interval}ms)`;
        super(guiOptions);
        this.interval = interval;
    }

    public read(): EtlObservable<number> {
        const observable = new EtlObservable<number>((subscriber) => {
            try {
                this.subscriber = subscriber;
                this.sendStartEvent();
                this.intervalId = setInterval(this.onTick.bind(this), this.interval);
            }
            catch(err) {
                this.sendErrorEvent(err);
                subscriber.error(err);
            }
        });
        return observable;
    }

    public async push(value: number) {
        super.push(value);
        this.counter = value;
    }

    public async clear() {
        super.clear();
        this.counter = 0;
    }

    protected onTick() {
        if (this.isPaused) return;
        try {
            this.sendDataEvent(this.counter);
            this.subscriber.next(this.counter);
            this.counter++;
        }
        catch(err) {
            this.sendErrorEvent(err);
            this.subscriber.error(err);
        }
    }

    public async stop() {
        try {
            clearInterval(this.intervalId);
            this.subscriber.complete();
            this.sendEndEvent();
            this.subscriber = null;
        }
        catch(err) {
            this.sendErrorEvent(err);
            this.subscriber.error(err);
        }
    }
}
