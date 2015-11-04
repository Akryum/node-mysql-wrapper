/// <reference path="../../typings/lodash/lodash.d.ts" />
/// <reference path="../../typings/bluebird/bluebird.d.ts" />
/// <reference path="../../typings/node/node.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Helper_1 = require("../Helper");
var LiveHelper_1 = require("./LiveHelper");
var SelectQueryRules_1 = require("../queries/SelectQueryRules");
var events_1 = require('events');
var Promise = require("bluebird");
var _ = require('lodash');
var LiveCollection = (function (_super) {
    __extends(LiveCollection, _super);
    function LiveCollection(table, name) {
        _super.call(this);
        this.table = table;
        this.name = name;
        this.debug = false;
        if (!name) {
            name = table.name;
        }
        this.list = [];
        this.startListeningToDatabase();
    }
    LiveCollection.prototype.startListeningToDatabase = function () {
        var _this = this;
        this.table.on("INSERT", function (rows) {
            rows.forEach(function (row) {
                var objRow = _this.table.objectFromRow(row);
                var canInsert = LiveHelper_1.default.canInsert(objRow, _this.criteriaRawJsObject);
                if (canInsert) {
                    _this.proccessJoinedTableInsert(objRow).then(function (_newPureItem) {
                        _this.list.push(_newPureItem);
                        _this.emit('INSERT', _newPureItem);
                    });
                }
            });
        });
        this.table.on("UPDATE", function (rows) {
            rows.forEach(function (row) {
                var rowUpdated = row["after"];
                var criteriaExistingItem = {};
                criteriaExistingItem[Helper_1.default.toObjectProperty(_this.table.primaryKey)] = rowUpdated[_this.table.primaryKey];
                var objRow = _this.table.objectFromRow(rowUpdated);
                LiveHelper_1.default._findAndUpdate(_this.list, criteriaExistingItem, objRow);
                _this.emit('UPDATE', objRow);
            });
        });
        this.table.on("DELETE", function (rows) {
            rows.forEach(function (row) {
                var toBeRemovedCriteria = {};
                toBeRemovedCriteria[Helper_1.default.toObjectProperty(_this.table.primaryKey)] = row[_this.table.primaryKey];
                _.remove(_this.list, toBeRemovedCriteria);
                _this.emit("DELETE", toBeRemovedCriteria);
            });
        });
    };
    Object.defineProperty(LiveCollection.prototype, "_collection", {
        get: function () {
            return this.list;
        },
        enumerable: true,
        configurable: true
    });
    LiveCollection.prototype.proccessJoinedTableInsert = function (objRow) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var newCriteriaForOneObject = {};
            if (_this.criteriaRawJsObject !== undefined) {
                var primaryKeyOfObjValue = objRow[Helper_1.default.toObjectProperty(_this.table.primaryKey)];
                newCriteriaForOneObject[Helper_1.default.toObjectProperty(_this.table.primaryKey)] = primaryKeyOfObjValue;
                Helper_1.default.forEachKey(_this.criteriaRawJsObject, function (key) {
                    if (objRow[key] === undefined) {
                        var joinedTable = _this.criteriaRawJsObject[key];
                        if (Helper_1.default.hasRules(joinedTable) && joinedTable[SelectQueryRules_1.TABLE_RULES_PROPERTY]["table"] !== undefined) {
                            newCriteriaForOneObject[key] = joinedTable;
                        }
                    }
                });
                _this.table.findSingle(newCriteriaForOneObject).then(function (_result) {
                    resolve(_result);
                });
            }
            else {
                resolve(objRow);
            }
        });
    };
    LiveCollection.prototype.listenToJoinedTables = function () {
        var _this = this;
        LiveHelper_1.default.listenToTable(this.table, this.list, this.criteriaRawJsObject, function (event, tablePart, objRow, selector, isArray) {
            if (event === "INSERT") {
                if (isArray) {
                    var toPushArrayObj = {};
                    toPushArrayObj["$push"] = {};
                    toPushArrayObj["$push"][tablePart.propertyName] = objRow;
                    LiveHelper_1.default._findAndUpdate(_this.list, selector, toPushArrayObj);
                }
                else {
                    var toSetObj = {};
                    toSetObj["$set"] = {};
                    toSetObj["$set"][tablePart.propertyName] = objRow;
                    LiveHelper_1.default._findAndUpdate(_this.list, selector, toSetObj);
                }
            }
            else if (event === "DELETE" || event === "UPDATE") {
                var toRemoveOrSetObj = {};
                if (event === "DELETE") {
                    toRemoveOrSetObj["$pull"] = {};
                    toRemoveOrSetObj["$pull"]["" + tablePart.propertyName + ""] = selector;
                }
                else {
                    toRemoveOrSetObj["$set"] = {};
                    toRemoveOrSetObj["$set"]["" + tablePart.propertyName + (isArray ? ".$" : "")] = objRow;
                }
                var selectorForParent = {};
                var joinedTable = _this.table.connection.table(tablePart.tableName);
                selectorForParent[tablePart.propertyName + "." + Helper_1.default.toObjectProperty(joinedTable.primaryKey)] = objRow[Helper_1.default.toObjectProperty(joinedTable.primaryKey)];
                LiveHelper_1.default._findAndUpdate(_this.list, selectorForParent, toRemoveOrSetObj);
            }
        });
    };
    LiveCollection.prototype.fill = function (criteriaRawJsObject) {
        var _this = this;
        if (criteriaRawJsObject === void 0) { criteriaRawJsObject = {}; }
        this.criteriaRawJsObject = criteriaRawJsObject;
        this.table.find(criteriaRawJsObject).then(function (results) {
            results.forEach(function (result) {
                _this.list.push(result);
            });
        });
        return this;
    };
    LiveCollection.prototype.fillAll = function () {
        //  let future = new Future;
        this.table.findAll().then(function (results) {
            results.forEach(function (result) {
            });
        });
        return this;
    };
    LiveCollection.prototype.fillOne = function (criteriaRawJsObject) {
        var _this = this;
        this.criteriaRawJsObject = criteriaRawJsObject;
        this.table.findSingle(criteriaRawJsObject).then(function (result) {
            _this.list.push(result);
        });
        return this;
    };
    return LiveCollection;
})(events_1.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LiveCollection;
