import * as Mysql from 'mysql';
import * as Util from 'util';
import * as Promise from 'bluebird';
import {EventEmitter} from 'events';
import Table from "./Table";
import Helper from "./Helper";
import {ZongJiInterface} from "./BinaryLogHelper"; //ALSO BAD BUT I HAVE TO DO IT....
var ZongJi: ZongJiInterface = require("zongji"); //THIS IS THE ONLY WAY I CAN DO IT, I MADE DEFINITIONS FOR ZONGJI BUT THEY AREN'T WORKING BECAUSE OF CLASS...

class Connection extends EventEmitter {
    connection: Mysql.IConnection;
    eventTypes = ["INSERT", "UPDATE", "DELETE"];
    tableNamesToUseOnly = [];
    tables: Table<any>[] = [];
    allowBinaryLogs: boolean = false;
    zongji: ZongJiInterface; //ZongJi

    constructor(connection: string | Mysql.IConnection | Mysql.IConnectionConfig) {
        super();
        this.create(connection);
    }

    create(connection: string | Mysql.IConnection | Mysql.IConnectionConfig): void {
        if (typeof connection === "string" || connection instanceof String) {
            this.attach(Mysql.createConnection(connection));
        } else if (connection["host"] !== undefined) { //means IConnectionConfig
            this.attach(Mysql.createConnection(connection));
        }
        else {   //means that is mysql already connection
            this.attach(<Mysql.IConnection>connection);
        }
    }

    attach(connection: Mysql.IConnection): void {
        this.connection = connection;
    }

    end(callback?: (error: any) => void): void {
        if (this.zongji) {
            this.zongji.stop();
        }
        this.eventTypes.forEach(_evt=> {
            this.removeAllListeners(_evt);
        });
        this.connection.end((err) => {
            // The connection is terminated now
            callback(err);

        });
    }

    destroy(): void {
        if (this.zongji) {
            this.zongji.stop();
        }
        this.eventTypes.forEach(_evt=> {
            this.removeAllListeners(_evt);
        });
        this.connection.destroy();
    }

    clearBinaryLogs(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.query("RESET MASTER", (err, noresults) => { //WORKED BUT I TESTED IT WITH GRAND PRIV, I DONT KNOW IF WORKING WITH SMALELR PRIV.
                resolve();

            });
        });
    }
    
    watchBinaryLogs(callbackWhenReady?: Function): void {
        if (!this.allowBinaryLogs) {
            console.log("Binary logs are off.\n Please google 'Enable Binary logs in MySQL' , and restart your mysql server and NodeJS/Meteor server.");
        } else {
            if (!this.zongji || this.zongji === undefined) { //ONLY ONE TIME INIT and start.
                this.zongji = new ZongJi(this.connection.config); //BEFORE clear logs.
                this.clearBinaryLogs().then(() => { //EVERY TIME clear the previous logs.            
                    
                    this.zongji.on('binlog', (evt) => {
                        //  evt.dump();
                        //edw 9a ginei to emit , apo this.notice me ta katalila events kai table.
                    
                    
                        //tableMap
                        //rows
                        //WriteRows, DeleteRows, UpdateRows
                    
               
                        //console.log(evt.constructor.name + " < cons name");


                        let _evtName = evt.constructor.name;

                        if (_evtName !== "TableMap") {
                            if (_evtName === "WriteRows") {
                                _evtName = "INSERT";
                            } else if (_evtName === "UpdateRows") {
                                _evtName = "UPDATE";
                            } else if (_evtName === "DeleteRows") {
                                _evtName = "DELETE";
                            }

                            let _tableName = evt.tableMap[evt.tableId].tableName;
                            //console.log("_evtName: " + _evtName + " _tableName: " + _tableName + ", rows: ", evt.rows);
                            this.notice(_tableName, _evtName, evt.rows);
                        } else {
                            //do nothing console.dir(evt);
                        }


                    });

                    this.zongji.start({
                        includeEvents: ['tablemap', 'writerows', "updaterows", "deleterows"]
                    });
                    if (callbackWhenReady) {
                        callbackWhenReady();
                    }

                });
            } else {
                if (callbackWhenReady) {
                    callbackWhenReady();
                }
            }
        }




    }

    link(readyCallback?: () => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let callback: Function = readyCallback ||
                ((err: any) => {
                    if (err) {
                        console.error('MYSQL: error connecting: ' + err.stack);
                        reject(err.stack);

                    }
                   
                    //console.log('MYSQL: connected as id ' + self.connection.threadId);
                    this.fetchDatabaseInformation().then(() => {
                        this.fetchBinaryInformation().then(() => {

                            resolve();
                        });
                    });
                    //   Promise.all([this.fetchDatabaseInformation, this.fetchBinaryInformation]).then(() => {
                    //      resolve();
                    //   });
                });

            // if (this.connection.state === 'authenticated') {
            if (this.connection['state'] === 'disconnected' || this.connection['state'] === 'connecting') {
                this.connection.connect(callback);
            } else {   //means this.connection['state'] === 'authenticated', so just callback and promise resolve.
                callback();
                resolve();
            }

        });
    }

    useOnly(...tables: any[]): void {
        for (let i = 0; i < tables.length; i++) {
            let _table = tables[i];
            if (typeof _table === 'string' || _table instanceof String) {
                //it is just the table name string
                this.tableNamesToUseOnly.push(_table);
            } else {
                //it is an array of strings
                for (let j = 0; j < _table.length; j++) {
                    this.tableNamesToUseOnly.push(_table[j]);
                }
            }
        }
    }

    fetchBinaryInformation(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.connection.query("SELECT * from information_schema.GLOBAL_VARIABLES WHERE VARIABLE_NAME = 'LOG_BIN';", (err: Mysql.IError, ...results: any[]) => {
                if (err) {
                    reject(err);
                }
                if (results.length > 0 && Array.isArray(results[0])) {

                    if (results[0][0]["VARIABLE_VALUE"] === 'ON') {
                        //binary logs are enabled.
                        // this.watchDatabaseEvents();
                        this.allowBinaryLogs = true;
                    }

                }
                resolve();

            });
        });
    }

    fetchDatabaseInformation(): Promise<void> {
        //Ta kanw ola edw gia na doulepsei to def.resolve kai na einai etoimo olo to module molis ola ta tables kai ola ta columns dhlwthoun.

        return new Promise<void>((resolve, reject) => {
            //ta results pou 9eloume einai panta ta: results[0]. 
            this.connection.query("SELECT DISTINCT TABLE_NAME ,column_name FROM INFORMATION_SCHEMA.key_column_usage WHERE TABLE_SCHEMA IN ('" + this.connection.config.database + "');",
                (err: Mysql.IError, ...results: any[]) => {
                    if (err) {
                        reject(err);
                    }
                    if (results.length > 0 && Array.isArray(results[0]) && results[0].length > 0) {
                        results[0].forEach((tableObj, currentPosition) => {
                            //.log(tableObj.TABLE_NAME);
                            if (this.tableNamesToUseOnly.length > 0 && this.tableNamesToUseOnly.indexOf(tableObj.TABLE_NAME) !== -1) {
                                //means that only to use called, and this table is not in this collection, so don't fetch it.

                            } else {
                                let _table = new Table(tableObj.TABLE_NAME, this);
                                _table.primaryKey = (tableObj.column_name);

                                this.connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" + this.connection.config.database + "' AND TABLE_NAME = '" + _table.name + "';", (errC: Mysql.IError, ...resultsC: any[]) => {
                                    if (errC) {
                                        reject(err);
                                    }

                                    let _tableColumns = [];

                                    for (let i = 0; i < resultsC[0].length; i++) {

                                        let _columnName = resultsC[0][i]['COLUMN_NAME']; //.COLUMN_NAME
                                        if (_columnName !== _table.primaryKey) {
                                            _tableColumns.push(_columnName);
                                        }
                                    }

                                    _table.columns = (_tableColumns);
                                    this.tables.push(_table);
                                    //console.log('pushing ' + _table.name + ' with primary: ' + _table.primaryKey + ' and columns: ');
                                    // console.dir(_table.columns);
                                    if (currentPosition === results[0].length - 1) {
                                        //otan teleiwsoume me ola

                                        resolve();
                                    }

                                });
                            }
                        });
                    } else {
                        reject("No infromation can be fetched by your database, please check your permissions");
                    }

                });

        });
    }

    escape(val: string): string {
        return this.connection.escape(val);
    }

    notice(tableWhichCalled: string, evtType: string, parsedResults: any[]): void {

        if (evtType !== undefined) {
            evtType = evtType.toUpperCase();
            /* if (evtType === 'INSERT' || evtType === 'UPDATE') {
                 this.emit(tableWhichCalled.toUpperCase() + ".SAVE", parsedResults);
             } else if (evtType === 'DELETE') {
                 this.emit(tableWhichCalled.toUpperCase() + ".REMOVE", parsedResults);
             }*/
            if (this.eventTypes.indexOf(evtType) !== -1) {
                this.emit(tableWhichCalled.toUpperCase() + "." + evtType, parsedResults);
            }

        }
    }

    //evtType:  EventTypes[]  | EventTypes | string,
    watch(tableName: string, evtType: any, callback: (parsedResults: any[]) => void): void {

        this.watchBinaryLogs(); //checks if nongji stopped and starts it.
    
        if (Array.isArray(evtType)) {
            //if it is array then we catch more than one event with the same callback, this maybe will be 'helpy' to some devs
            for (let i = 0; i < evtType.length; i++) {
                let _theEventType = evtType[i].toUpperCase();
                if (this.eventTypes.indexOf(_theEventType) !== -1) {
                    this.on(tableName.toUpperCase() + "." + _theEventType, callback);
                }
            }
        } else {
            evtType = evtType.toUpperCase();
            if (this.eventTypes.indexOf(evtType) !== -1) {
                this.on(tableName.toUpperCase() + "." + evtType, callback);
            }
        }

    }

    //evtType: EventTypes 
    unwatch(tableName: string, evtType: string, callbackToRemove: (parsedResults: any[]) => void): void {

        evtType = evtType.toUpperCase();
        if (this.eventTypes.indexOf(evtType) !== -1) {
            this.removeListener(tableName.toUpperCase() + "." + evtType, callbackToRemove);
        }
        
        ///TODO: edw an dn exoun minei alla events tote na kanw turn off to zonji na min trexei adika(??)
    }

    query(queryStr: string, callback: (err: Mysql.IError, results: any) => any, queryArguments?: any[]): void {

        if (queryArguments) {

            this.connection.query(queryStr, queryArguments, (err, results) => {
                if (results === undefined) {
                    results = [];
                }
                callback(err, results);
            });
        } else {        //means only: queryStr and the callback
          
            this.connection.query(queryStr, (err, results) => {
                //in order to developer see the error in his/her console window->
                if (results === undefined) {
                    results = [];
                }
                //end
                callback(err, results);
            });
        }
    }

    table<T>(tableName: string): Table<T> {
        for (let i = 0; i < this.tables.length; i++) {
            if (this.tables[i].name === tableName || this.tables[i].name === Helper.toObjectProperty(tableName)) {

                return this.tables[i];
            }
        }
        return undefined;
    }


}

export default Connection;