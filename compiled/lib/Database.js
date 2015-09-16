import Helper from "./Helper";
import { SelectQueryRules } from "./queries/SelectQueryRules";
import * as Promise from 'bluebird';
class Database {
    constructor(connection) {
        this.readyListenerCallbacks = new Array();
        this.setConnection(connection);
    }
    static when(..._promises) {
        return new Promise((resolve, reject) => {
            //  let promises = Array.prototype.slice.call(arguments);
            if (Array.isArray(_promises[0])) {
                _promises = Array.prototype.slice.call(_promises[0]);
            }
            Promise.all(_promises).then((results) => {
                resolve(results);
            }).catch((_err) => { reject(_err); });
        });
    }
    setConnection(connection) {
        this.connection = connection;
    }
    useOnly(...useTables) {
        this.connection.useOnly(useTables);
    }
    has(tableName, functionName) {
        if (this[tableName] !== undefined) {
            if (functionName) {
                return this[tableName][functionName] !== undefined;
            }
            else {
                return true;
            }
        }
        return false;
    }
    ready(callback) {
        this.readyListenerCallbacks.push(callback);
        if (this.readyListenerCallbacks.length === 1) {
            this.connection.link().then(() => {
                [].forEach.call(this.connection.tables, (_table) => {
                    this[Helper.toObjectProperty(_table.name)] = this[_table.name] = _table;
                });
                this.noticeReady();
            });
        }
    }
    table(tableName) {
        return this.connection.table(tableName);
    }
    noticeReady() {
        for (let i = 0; i < this.readyListenerCallbacks.length; i++) {
            this.readyListenerCallbacks[i]();
        }
    }
    removeReadyListener(callback) {
        for (let i = 0; i < this.readyListenerCallbacks.length; i++) {
            if (this.readyListenerCallbacks[i] === callback) {
                this.readyListenerCallbacks.slice(i, 1);
                break;
            }
        }
    }
    query(queryStr, callback, queryArguments) {
        this.connection.query(queryStr, callback, queryArguments);
    }
    destroy() {
        this.readyListenerCallbacks = [];
        this.connection.destroy();
    }
    end(maybeAcallbackError) {
        this.readyListenerCallbacks = [];
        this.connection.end(maybeAcallbackError);
    }
    newTableRules(tableName) {
        let tbRule = new SelectQueryRules();
        this.table(tableName).rules = tbRule;
        return tbRule;
    }
    buildRules(parentRules) {
        let newRules = new SelectQueryRules();
        if (parentRules) {
            newRules.from(parentRules);
        }
        return newRules;
    }
}
export default Database;
