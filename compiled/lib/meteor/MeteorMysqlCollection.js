var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Helper_1 = require("../Helper");
var ConditionalConverter_1 = require("../ConditionalConverter");
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
                var canInsert = _this.objectCanInsert(objRow, _this.criteriaRawJsObject);
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
    MeteorMysqlCollection.prototype.objectCanInsert = function (objRow, rawCriteria, joinedRow) {
        var _this = this;
        var canInsert = true;
        Helper_1.default.forEachKey(rawCriteria, function (key) {
            if (!canInsert) {
                return;
            }
            if (objRow[key] !== undefined) {
                try {
                    var _symbolCombarison = ConditionalConverter_1.default.toJS(rawCriteria[key].split(" ")[0]);
                    var valComparison = rawCriteria[key].split(" ")[1];
                    var ifEvalStatementStr = objRow[key] + _symbolCombarison + valComparison;
                    ifEvalStatementStr = ConditionalConverter_1.default.toJSConditional(ifEvalStatementStr);
                    if (_this.debug) {
                        console.log('IF EVAL: ' + ifEvalStatementStr);
                    }
                    if (!eval(ifEvalStatementStr)) {
                        canInsert = false;
                    }
                }
                catch (ex) {
                }
            }
        });
        return canInsert;
    };
    MeteorMysqlCollection.prototype.listenToJoinedTables = function () {
        var _this = this;
        var criteria = this.table.criteriaDivider.divide(this.criteriaRawJsObject);
        criteria.tables.forEach(function (_tb) {
            var joinedTableObj = _this.table.connection.table(_tb.tableName);
            var joinedTableCriteria = joinedTableObj.criteriaDivider.divide(criteria.rawCriteriaObject[_tb.propertyName]);
            joinedTableObj.on("INSERT", Meteor.bindEnvironment(function (rows) {
                rows.forEach(function (row) {
                    var objRow = joinedTableObj.objectFromRow(row);
                    _this._collection.find().fetch().forEach(function (_objInlist) {
                        var joinedCriteria = {};
                        Helper_1.default.forEachKey(joinedTableCriteria.rawCriteriaObject, function (key) {
                            try {
                                var valWithoutComparison = joinedTableCriteria.rawCriteriaObject[key].split(" ")[1];
                                var valComparisonSymbol = joinedTableCriteria.rawCriteriaObject[key].split(" ")[0];
                                if (_this.debug) {
                                    console.log('KEY: ' + key + ' SYMBOL: ' + valComparisonSymbol + ' VAL: ' + valWithoutComparison);
                                }
                                if (_objInlist[valWithoutComparison] !== undefined) {
                                    joinedCriteria[key] = valComparisonSymbol + " " + _objInlist[valWithoutComparison];
                                }
                            }
                            catch (ex) {
                            }
                        });
                        var canInsert = _this.objectCanInsert(objRow, joinedCriteria);
                        if (canInsert) {
                            if (_this.debug) {
                                console.log('CAN INSERT ON: ', _objInlist);
                            }
                            var parentPropName = _tb.propertyName;
                            var primkey = Helper_1.default.toObjectProperty(_this.table.primaryKey);
                            var objToFind = {};
                            objToFind[primkey] = _objInlist[primkey];
                            if (_objInlist[parentPropName] instanceof Array) {
                                _objInlist[parentPropName].push(objRow);
                                var toPushArrayObj = {};
                                toPushArrayObj["$push"] = {};
                                toPushArrayObj["$push"][parentPropName] = objRow;
                                var updateResult = _this.collection.update(objToFind, toPushArrayObj, { multi: true, upsert: false }, function (err, res) {
                                    if (_this.debug) {
                                        if (err) {
                                            console.log('ERROR ON UPDATE: ' + err);
                                        }
                                        console.log("------------------------RESULT(1=success,0=faled): " + res + " PUSHED TO ARRAY, NEW ARRAY LENGTH: " + _objInlist[parentPropName]["length"]);
                                    }
                                });
                            }
                            else {
                                var toSetObj = {};
                                toSetObj["$set"] = {};
                                toSetObj["$set"][parentPropName] = objRow;
                                _this.collection.update(objToFind, toSetObj);
                            }
                        }
                    });
                });
            }));
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
