import * as Mysql from 'mysql';
import * as Promise from 'bluebird';
import { EventEmitter } from 'events';
import Table from "./Table";
import Helper from "./Helper";
class Connection extends EventEmitter {
    constructor(connection) {
        super();
        this.eventTypes = ["INSERT", "UPDATE", "REMOVE", "SAVE"];
        this.tableNamesToUseOnly = [];
        this.tables = [];
        this.create(connection);
    }
    create(connection) {
        if (typeof connection === "string" || connection instanceof String) {
            this.attach(Mysql.createConnection(connection));
        }
        else {
            this.attach(connection);
        }
    }
    attach(connection) {
        this.connection = connection;
    }
    end(callback) {
        this.eventTypes.forEach(_evt => {
            this.removeAllListeners(_evt);
        });
        this.connection.end((err) => {
            callback(err);
        });
    }
    destroy() {
        this.eventTypes.forEach(_evt => {
            this.removeAllListeners(_evt);
        });
        this.connection.destroy();
    }
    link(readyCallback) {
        return new Promise((resolve, reject) => {
            let callback = readyCallback ||
                ((err) => {
                    if (err) {
                        console.error('MYSQL: error connecting: ' + err.stack);
                        reject(err.stack);
                    }
                    this.fetchDatabaseInfornation().then(() => {
                        resolve();
                    });
                });
            if (this.connection['state'] === 'disconnected' || this.connection['state'] === 'connecting') {
                this.connection.connect(callback);
            }
            else {
                callback();
                resolve();
            }
        });
    }
    useOnly(...tables) {
        for (let i = 0; i < tables.length; i++) {
            let _table = tables[i];
            if (typeof _table === 'string' || _table instanceof String) {
                this.tableNamesToUseOnly.push(_table);
            }
            else {
                for (let j = 0; j < _table.length; j++) {
                    this.tableNamesToUseOnly.push(_table[j]);
                }
            }
        }
    }
    fetchDatabaseInfornation() {
        //Ta kanw ola edw gia na doulepsei to def.resolve kai na einai etoimo olo to module molis ola ta tables kai ola ta columns dhlwthoun.
        return new Promise((resolve, reject) => {
            this.connection.query("SELECT DISTINCT TABLE_NAME ,column_name FROM INFORMATION_SCHEMA.key_column_usage WHERE TABLE_SCHEMA IN ('" + this.connection.config.database + "');", (err, ...results) => {
                if (err) {
                    reject(err);
                }
                if (results.length > 0 && Array.isArray(results[0]) && results[0].length > 0) {
                    results[0].forEach((tableObj, currentPosition) => {
                        if (this.tableNamesToUseOnly.length > 0 && this.tableNamesToUseOnly.indexOf(tableObj.TABLE_NAME) !== -1) {
                        }
                        else {
                            let _table = new Table(tableObj.TABLE_NAME, this);
                            _table.primaryKey = (tableObj.column_name);
                            this.connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" + this.connection.config.database + "' AND TABLE_NAME = '" + _table.name + "';", (errC, ...resultsC) => {
                                if (errC) {
                                    reject(err);
                                }
                                let _tableColumns = [];
                                for (let i = 0; i < resultsC[0].length; i++) {
                                    let _columnName = resultsC[0][i]['COLUMN_NAME'];
                                    if (_columnName !== _table.primaryKey) {
                                        _tableColumns.push(_columnName);
                                    }
                                }
                                _table.columns = (_tableColumns);
                                this.tables.push(_table);
                                if (currentPosition === results[0].length - 1) {
                                    resolve();
                                }
                            });
                        }
                    });
                }
                else {
                    reject("No infromation can be fetched by your database, please check your permissions");
                }
            });
        });
    }
    escape(val) {
        return this.connection.escape(val);
    }
    notice(tableWhichCalled, queryStr, parsedResults) {
        let evtType;
        if (queryStr.indexOf(' ') === -1) {
            evtType = undefined;
        }
        else {
            evtType = queryStr.substr(0, queryStr.indexOf(' ')).toUpperCase();
        }
        if (evtType !== undefined) {
            if (evtType === 'INSERT' || evtType === 'UPDATE') {
                this.emit(tableWhichCalled.toUpperCase() + ".SAVE", parsedResults);
            }
            else if (evtType === 'DELETE') {
                this.emit(tableWhichCalled.toUpperCase() + ".REMOVE", parsedResults);
            }
            this.emit(tableWhichCalled.toUpperCase() + "." + evtType, parsedResults);
        }
    }
    watch(tableName, evtType, callback) {
        if (Array.isArray(evtType)) {
            for (let i = 0; i < evtType.length; i++) {
                let _theEventType = evtType[i].toUpperCase();
                if (this.eventTypes.indexOf(_theEventType) !== -1) {
                    this.on(tableName.toUpperCase() + "." + _theEventType, callback);
                }
            }
        }
        else {
            evtType = evtType.toUpperCase();
            if (this.eventTypes.indexOf(evtType) !== -1) {
                this.on(tableName.toUpperCase() + "." + evtType, callback);
            }
        }
    }
    unwatch(tableName, evtType, callbackToRemove) {
        evtType = evtType.toUpperCase();
        if (this.eventTypes.indexOf(evtType) !== -1) {
            this.removeListener(tableName.toUpperCase() + "." + evtType, callbackToRemove);
        }
    }
    query(queryStr, callback, queryArguments) {
        if (queryArguments) {
            this.connection.query(queryStr, queryArguments, (err, results) => {
                if (results === undefined) {
                    results = [];
                }
                callback(err, results);
            });
        }
        else {
            this.connection.query(queryStr, (err, results) => {
                if (results === undefined) {
                    results = [];
                }
                callback(err, results);
            });
        }
    }
    table(tableName) {
        for (let i = 0; i < this.tables.length; i++) {
            if (this.tables[i].name === tableName || this.tables[i].name === Helper.toObjectProperty(tableName)) {
                return this.tables[i];
            }
        }
        return undefined;
    }
}
export default Connection;
