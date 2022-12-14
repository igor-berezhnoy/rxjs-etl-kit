import * as pg from 'pg'
import { Observable } from "rxjs";
import { Endpoint, GuiManager } from '../core';
import { EndpointGuiOptions, EndpointImpl } from '../core/endpoint';
import { EtlObservable } from '../core/observable';

export class PostgresEndpoint<T = Record<string, any>> extends EndpointImpl<T> {
    protected static instanceNo = 0;
    protected table: string;
    protected pool: any;

    constructor(table: string, url: string, guiOptions?: EndpointGuiOptions<T>);
    constructor(table: string, pool: any, guiOptions?: EndpointGuiOptions<T>);
    constructor(table: string, connection: any, guiOptions: EndpointGuiOptions<T> = {}) {
        guiOptions.displayName = guiOptions.displayName ?? `PostgreSQL ${++PostgresEndpoint.instanceNo}(${table})`;
        super(guiOptions);
        this.table = table;

        if (typeof connection == "string") {
            const config = { connectionString: connection };
            this.pool = new pg.Pool(config);
        }
        else {
            this.pool = connection;
        }
    }

    public read(where: string | {} = ''): EtlObservable<T> {
        const observable = new EtlObservable<T>((subscriber) => {
            (async () => {
                try {
                    this.sendStartEvent();
                    let params = [];
                    if (where && typeof where === 'object') {
                        where = this.getWhereAsString(where);
                        params = this.getCommaSeparatedValues(where);
                    }

                    const query = `select * from ${this.table} ${where ? 'where ' + where : ''}`;
                    const results = await this.pool.query(query, params);
                    for (const row of results.rows) {
                        await this.waitWhilePaused();
                        this.sendDataEvent(row);
                        subscriber.next(row);
                    }
                    subscriber.complete();
                    this.sendEndEvent();
                }
                catch(err) {
                    this.sendErrorEvent(err);
                    subscriber.error(err);
                }
            })();
        });
        return observable;
    }

    public async push(value: T) {
        super.push(value);
        const query = `insert into ${this.table}(${this.getCommaSeparatedFields(value)}) values ${this.getCommaSeparatedParams(value)}`;
        await this.pool.query(query, this.getCommaSeparatedValues(value));
        // TODO: returning id or the whole T-value
    }

    public async clear(where: string | {} = '') {
        super.clear();
        let params = [];
        if (where && typeof where === 'object') {
            where = this.getWhereAsString(where);
            params = this.getCommaSeparatedValues(where);
        }

        const query = `delete from ${this.table} ${where ? 'where ' + where : ''}`;
        await this.pool.query(query, params);
    }

    protected getCommaSeparatedFields(value: T) {
        let res = '';
        for (let key in value) {
            if (value.hasOwnProperty(key)) {
                if (res) res += ", ";
                res += key;
            }
        }
        return res;
    }

    protected getCommaSeparatedParams(value: T) {
        let res = '', n = 1;
        for (let key in value) {
            if (value.hasOwnProperty(key)) {
                if (res) res += ", ";
                res += "$" + n;
                n++;
            }
        }
        return res;
    }

    protected getCommaSeparatedValues(value: {}) {
        let res = [];
        for (let key in value) {
            if (value.hasOwnProperty(key)) {
                res.push(value[key]);
            }
        }
        return res;
    }

    protected getWhereAsString(where: {}) {
        let res = '', n = 1;
        for (let key in where) {
            if (where.hasOwnProperty(key)) {
                if (res) res += " and ";
                res += key + " = $" + n;
                n++;
            }
        }
        return res;
    }

}
