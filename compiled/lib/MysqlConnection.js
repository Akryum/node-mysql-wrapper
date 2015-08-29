var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../typings/mysql/mysql.d.ts"/>
/// <reference path="../typings/bluebird/bluebird.d.ts"/> 
/// <reference path="./MysqlTable.ts"/> 
var Mysql = require('mysql');
var Promise = require('bluebird');
var events_1 = require('events');
var MysqlTable_1 = require("./MysqlTable");
var MysqlUtil_1 = require("./MysqlUtil");
var MysqlConnection = (function (_super) {
    __extends(MysqlConnection, _super);
    function MysqlConnection(connection) {
        _super.call(this);
        this.eventTypes = ["INSERT", "UPDATE", "REMOVE", "SAVE"];
        this.tableNamesToUseOnly = [];
        this.tables = [];
        this.create(connection);
    }
    MysqlConnection.prototype.create = function (connection) {
        if (typeof connection === "string" || connection instanceof String) {
            this.attach(Mysql.createConnection(connection));
        }
        else {
            this.attach(connection);
        }
    };
    MysqlConnection.prototype.attach = function (connection) {
        this.connection = connection;
    };
    MysqlConnection.prototype.end = function (callback) {
        var _this = this;
        this.eventTypes.forEach(function (_evt) {
            _this.removeAllListeners(_evt);
        });
        this.connection.end(function (err) {
            callback(err);
        });
    };
    MysqlConnection.prototype.destroy = function () {
        var _this = this;
        this.eventTypes.forEach(function (_evt) {
            _this.removeAllListeners(_evt);
        });
        this.connection.destroy();
    };
    MysqlConnection.prototype.link = function (readyCallback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var callback = readyCallback ||
                (function (err) {
                    if (err) {
                        console.error('MYSQL: error connecting: ' + err.stack);
                        reject(err.stack);
                    }
                    _this.fetchDatabaseInfornation().then(function () {
                        resolve();
                    });
                });
            if (_this.connection['state'] === 'disconnected' || _this.connection['state'] === 'connecting') {
                _this.connection.connect(callback);
            }
            else {
                callback();
                resolve();
            }
        });
    };
    MysqlConnection.prototype.useOnly = function () {
        var tables = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tables[_i - 0] = arguments[_i];
        }
        for (var i = 0; i < tables.length; i++) {
            var _table = tables[i];
            if (typeof _table === 'string' || _table instanceof String) {
                this.tableNamesToUseOnly.push(_table);
            }
            else {
                for (var j = 0; j < _table.length; j++) {
                    this.tableNamesToUseOnly.push(_table[j]);
                }
            }
        }
    };
    MysqlConnection.prototype.fetchDatabaseInfornation = function () {
        //Ta kanw ola edw gia na doulepsei to def.resolve kai na einai etoimo olo to module molis ola ta tables kai ola ta columns dhlwthoun.
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connection.query("SELECT DISTINCT TABLE_NAME ,column_name FROM INFORMATION_SCHEMA.key_column_usage WHERE TABLE_SCHEMA IN ('" + _this.connection.config.database + "');", function (err) {
                var results = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    results[_i - 1] = arguments[_i];
                }
                if (err) {
                    reject(err);
                }
                if (results.length > 0 && Array.isArray(results[0]) && results[0].length > 0) {
                    results[0].forEach(function (tableObj, currentPosition) {
                        if (_this.tableNamesToUseOnly.length > 0 && _this.tableNamesToUseOnly.indexOf(tableObj.TABLE_NAME) !== -1) {
                        }
                        else {
                            var _table = new MysqlTable_1.default(tableObj.TABLE_NAME, _this);
                            _table.primaryKey = (tableObj.column_name);
                            _this.connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" + _this.connection.config.database + "' AND TABLE_NAME = '" + _table.name + "';", function (errC) {
                                var resultsC = [];
                                for (var _i = 1; _i < arguments.length; _i++) {
                                    resultsC[_i - 1] = arguments[_i];
                                }
                                if (errC) {
                                    reject(err);
                                }
                                var _tableColumns = [];
                                for (var i = 0; i < resultsC[0].length; i++) {
                                    var _columnName = resultsC[0][i]['COLUMN_NAME'];
                                    if (_columnName !== _table.primaryKey) {
                                        _tableColumns.push(_columnName);
                                    }
                                }
                                _table.columns = (_tableColumns);
                                _this.tables.push(_table);
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
    };
    MysqlConnection.prototype.escape = function (val) {
        return this.connection.escape(val);
    };
    MysqlConnection.prototype.notice = function (tableWhichCalled, queryStr, parsedResults) {
        var evtType;
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
    };
    MysqlConnection.prototype.watch = function (tableName, evtType, callback) {
        if (Array.isArray(evtType)) {
            for (var i = 0; i < evtType.length; i++) {
                var _theEventType = evtType[i].toUpperCase();
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
    };
    MysqlConnection.prototype.unwatch = function (tableName, evtType, callbackToRemove) {
        evtType = evtType.toUpperCase();
        if (this.eventTypes.indexOf(evtType) !== -1) {
            this.removeListener(tableName.toUpperCase() + "." + evtType, callbackToRemove);
        }
    };
    MysqlConnection.prototype.query = function (queryStr, callback, queryArguments) {
        if (queryArguments) {
            this.connection.query(queryStr, queryArguments, function (err, results) {
                callback(err, results);
            });
        }
        else {
            this.connection.query(queryStr, function (err, results) {
                callback(err, results);
            });
        }
    };
    MysqlConnection.prototype.table = function (tableName) {
        for (var i = 0; i < this.tables.length; i++) {
            if (this.tables[i].name === tableName || this.tables[i].name === MysqlUtil_1.default.toObjectProperty(tableName)) {
                return this.tables[i];
            }
        }
        return undefined;
    };
    return MysqlConnection;
})(events_1.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MysqlConnection;
