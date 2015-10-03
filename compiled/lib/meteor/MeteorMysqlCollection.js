var Helper_1 = require("../Helper");
var SelectQueryRules_1 = require("../queries/SelectQueryRules");
var MeteorMysqlCollection = (function () {
    function MeteorMysqlCollection(table, name) {
        this.table = table;
        this.name = name;
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
                var _newPureItem = _this.proccessJoinedTableInsert(_this.table.objectFromRow(row));
                _this.collection.insert(_newPureItem);
            });
        }));
        this.table.on("UPDATE", Meteor.bindEnvironment(function (rows) {
            rows.forEach(function (row) {
                var rowUpdated = row["after"];
                var criteriaExistingItem = {};
                criteriaExistingItem[Helper_1.default.toObjectProperty(_this.table.primaryKey)] = rowUpdated[_this.table.primaryKey];
                var objRow = _this.table.objectFromRow(rowUpdated);
                _this.collection.update(criteriaExistingItem, objRow);
            });
        }));
        this.table.on("DELETE", Meteor.bindEnvironment(function (rows) {
            rows.forEach(function (row) {
                var toBeRemovedCriteria = {};
                toBeRemovedCriteria[Helper_1.default.toObjectProperty(_this.table.primaryKey)] = row[_this.table.primaryKey];
                _this.collection.remove(toBeRemovedCriteria);
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
    MeteorMysqlCollection.prototype._ensureIndex = function (indexName, options) {
        return this.collection._ensureIndex(indexName, options);
    };
    MeteorMysqlCollection.prototype.allow = function (options) {
        return this.collection.allow(options);
    };
    MeteorMysqlCollection.prototype.deny = function (options) {
        return this.collection.deny(options);
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
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MeteorMysqlCollection;
