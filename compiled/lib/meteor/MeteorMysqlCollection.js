var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Helper_1 = require("../Helper");
var MeteorHelper_1 = require("./MeteorHelper");
var SelectQueryRules_1 = require("../queries/SelectQueryRules");
var events_1 = require('events');
var MeteorMysqlCollection = (function (_super) {
    __extends(MeteorMysqlCollection, _super);
    function MeteorMysqlCollection(table, name) {
        _super.call(this);
        this.table = table;
        this.name = name;
        this.debug = false;
        if (!name) {
            name = table.name;
        }
        if (Meteor) {
            Future = require("fibers/future");
        }
        this.collection = new Mongo.Collection(name, { connection: null });
        this.startListeningToDatabase();
    }
    MeteorMysqlCollection.prototype.startListeningToDatabase = function () {
        var _this = this;
        this.table.on("INSERT", Meteor.bindEnvironment(function (rows) {
            rows.forEach(function (row) {
                var objRow = _this.table.objectFromRow(row);
                var canInsert = MeteorHelper_1.default.canInsert(objRow, _this.criteriaRawJsObject);
                if (canInsert) {
                    var _newPureItem = _this.proccessJoinedTableInsert(objRow);
                    _this.collection.insert(_newPureItem);
                    _this.emit('INSERT', _newPureItem);
                }
            });
        }));
        this.table.on("UPDATE", Meteor.bindEnvironment(function (rows) {
            rows.forEach(function (row) {
                var rowUpdated = row["after"];
                var criteriaExistingItem = {};
                criteriaExistingItem[Helper_1.default.toObjectProperty(_this.table.primaryKey)] = rowUpdated[_this.table.primaryKey];
                var objRow = _this.table.objectFromRow(rowUpdated);
                _this.collection.update(criteriaExistingItem, objRow);
                _this.emit('UPDATE', objRow);
            });
        }));
        this.table.on("DELETE", Meteor.bindEnvironment(function (rows) {
            rows.forEach(function (row) {
                var toBeRemovedCriteria = {};
                toBeRemovedCriteria[Helper_1.default.toObjectProperty(_this.table.primaryKey)] = row[_this.table.primaryKey];
                _this.collection.remove(toBeRemovedCriteria);
                _this.emit("DELETE", toBeRemovedCriteria);
            });
        }));
    };
    MeteorMysqlCollection.prototype.proccessJoinedTableInsert = function (objRow) {
        var _this = this;
        var future = new Future;
        var newCriteriaForOneObject = {};
        if (this.criteriaRawJsObject !== undefined) {
            var primaryKeyOfObjValue = objRow[Helper_1.default.toObjectProperty(this.table.primaryKey)];
            newCriteriaForOneObject[Helper_1.default.toObjectProperty(this.table.primaryKey)] = primaryKeyOfObjValue;
            Helper_1.default.forEachKey(this.criteriaRawJsObject, function (key) {
                if (objRow[key] === undefined) {
                    var joinedTable = _this.criteriaRawJsObject[key];
                    if (Helper_1.default.hasRules(joinedTable) && joinedTable[SelectQueryRules_1.TABLE_RULES_PROPERTY]["table"] !== undefined) {
                        newCriteriaForOneObject[key] = joinedTable;
                    }
                }
            });
            this.table.findSingle(newCriteriaForOneObject).then(function (_result) {
                future.return(_result);
            });
        }
        else {
            future.return(objRow);
        }
        return future.wait();
    };
    MeteorMysqlCollection.prototype.rawCollection = function () {
        return this.collection.rawCollection();
    };
    MeteorMysqlCollection.prototype.rawDatabase = function () {
        return this.collection.rawDatabase();
    };
    Object.defineProperty(MeteorMysqlCollection.prototype, "_collection", {
        get: function () {
            return this.collection;
        },
        enumerable: true,
        configurable: true
    });
    MeteorMysqlCollection.prototype._ensureIndex = function (indexName, options) {
        return this.collection._ensureIndex(indexName, options);
    };
    MeteorMysqlCollection.prototype.allow = function (options) {
        return this.collection.allow(options);
    };
    MeteorMysqlCollection.prototype.deny = function (options) {
        return this.collection.deny(options);
    };
    MeteorMysqlCollection.prototype.listenToJoinedTables = function () {
        var _this = this;
        MeteorHelper_1.default.listenToTableInsert(this.table, this.collection.find().fetch(), this.criteriaRawJsObject, function (parentPropName, objRow, selector, isArray) {
            if (isArray) {
                var toPushArrayObj = {};
                toPushArrayObj["$push"] = {};
                toPushArrayObj["$push"][parentPropName] = objRow;
                var updateResult = _this.collection.update(selector, toPushArrayObj, { multi: false, upsert: false }, function (err, res) {
                });
            }
            else {
                var toSetObj = {};
                toSetObj["$set"] = {};
                toSetObj["$set"][parentPropName] = objRow;
                _this.collection.update(selector, toSetObj);
            }
        });
    };
    MeteorMysqlCollection.prototype.fill = function (criteriaRawJsObject) {
        var _this = this;
        if (criteriaRawJsObject === void 0) { criteriaRawJsObject = {}; }
        var future = new Future;
        this.criteriaRawJsObject = criteriaRawJsObject;
        this.table.find(criteriaRawJsObject).then(Meteor.bindEnvironment(function (results) {
            results.forEach(function (result) {
                _this.collection.insert(result);
            });
            _this.listenToJoinedTables();
            future.return(_this);
        }));
        return future.wait();
    };
    MeteorMysqlCollection.prototype.fillAll = function () {
        var _this = this;
        var future = new Future;
        this.table.findAll().then(Meteor.bindEnvironment(function (results) {
            results.forEach(function (result) {
                _this.collection.insert(result);
            });
            future.return(_this);
        }));
        return future.wait();
    };
    MeteorMysqlCollection.prototype.fillOne = function (criteriaRawJsObject) {
        var _this = this;
        var future = new Future;
        this.criteriaRawJsObject = criteriaRawJsObject;
        this.table.findSingle(criteriaRawJsObject).then(Meteor.bindEnvironment(function (result) {
            _this.collection.insert(result);
            future.return(_this);
        }));
        return future.wait();
    };
    MeteorMysqlCollection.prototype.find = function (selector, options) {
        return this.collection.find(selector ? selector : {}, options ? options : {});
    };
    MeteorMysqlCollection.prototype.findOne = function (selector, options) {
        return this.collection.findOne(selector ? selector : {}, options ? options : {});
    };
    MeteorMysqlCollection.prototype.insert = function (doc, callback) {
        var _this = this;
        var future = new Future;
        this.table.save(doc).then(Meteor.bindEnvironment(function (res) {
            var _primarykey = res[Helper_1.default.toObjectProperty(_this.table.primaryKey)];
            if (callback !== undefined) {
                callback(_primarykey);
            }
            future.return(_primarykey);
        }));
        return future.wait();
    };
    MeteorMysqlCollection.prototype.remove = function (selector, callback) {
        var future = new Future;
        this.table.remove(selector).then(Meteor.bindEnvironment(function (res) {
            if (callback !== undefined) {
                callback(res);
            }
            future.return(res);
        }));
        return future.wait();
    };
    MeteorMysqlCollection.prototype.update = function (selector, modifier, options, callback) {
        var future = new Future;
        this.table.save(selector).then(Meteor.bindEnvironment(function (res) {
            if (callback !== undefined) {
                callback(1);
            }
            future.return(1);
        }, function (err) {
            if (callback !== undefined) {
                callback(-1);
            }
            future.return(-1);
        }));
        return future.wait();
    };
    return MeteorMysqlCollection;
})(events_1.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MeteorMysqlCollection;
