var Helper_1 = require("./Helper");
var SelectQueryRules_1 = require("./queries/SelectQueryRules");
var Promise = require('bluebird');
var Database = (function () {
    function Database(connection) {
        this.readyListenerCallbacks = new Array();
        this.setConnection(connection);
    }
    Database.when = function () {
        var _promises = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _promises[_i - 0] = arguments[_i];
        }
        return new Promise(function (resolve, reject) {
            //  let promises = Array.prototype.slice.call(arguments);
            if (Array.isArray(_promises[0])) {
                _promises = Array.prototype.slice.call(_promises[0]);
            }
            Promise.all(_promises).then(function (results) {
                resolve(results);
            }).catch(function (_err) { reject(_err); });
        });
    };
    Database.prototype.setConnection = function (connection) {
        this.connection = connection;
    };
    Database.prototype.useOnly = function () {
        var useTables = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            useTables[_i - 0] = arguments[_i];
        }
        this.connection.useOnly(useTables);
    };
    Database.prototype.has = function (tableName, functionName) {
        if (this[tableName] !== undefined) {
            if (functionName) {
                return this[tableName][functionName] !== undefined;
            }
            else {
                return true;
            }
        }
        return false;
    };
    Database.prototype.ready = function (callback) {
        var _this = this;
        this.readyListenerCallbacks.push(callback);
        if (this.readyListenerCallbacks.length === 1) {
            this.connection.link().then(function () {
                [].forEach.call(_this.connection.tables, function (_table) {
                    _this[Helper_1.default.toObjectProperty(_table.name)] = _this[_table.name] = _table;
                });
                _this.noticeReady();
            });
        }
    };
    Database.prototype.table = function (tableName) {
        return this.connection.table(tableName);
    };
    Database.prototype.noticeReady = function () {
        for (var i = 0; i < this.readyListenerCallbacks.length; i++) {
            this.readyListenerCallbacks[i]();
        }
    };
    Database.prototype.removeReadyListener = function (callback) {
        for (var i = 0; i < this.readyListenerCallbacks.length; i++) {
            if (this.readyListenerCallbacks[i] === callback) {
                this.readyListenerCallbacks.slice(i, 1);
                break;
            }
        }
    };
    Database.prototype.query = function (queryStr, callback, queryArguments) {
        this.connection.query(queryStr, callback, queryArguments);
    };
    Database.prototype.destroy = function () {
        this.readyListenerCallbacks = [];
        this.connection.destroy();
    };
    Database.prototype.end = function (maybeAcallbackError) {
        this.readyListenerCallbacks = [];
        this.connection.end(maybeAcallbackError);
    };
    Database.prototype.newTableRules = function (tableName) {
        var tbRule = new SelectQueryRules_1.SelectQueryRules();
        this.table(tableName).rules = tbRule;
        return tbRule;
    };
    Database.prototype.buildRules = function (parentRules) {
        var newRules = new SelectQueryRules_1.SelectQueryRules();
        if (parentRules) {
            newRules.from(parentRules);
        }
        return newRules;
    };
    return Database;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Database;
