var Helper_1 = require("../Helper");
var MeteorCollection = (function () {
    function MeteorCollection(table, name) {
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
    MeteorCollection.prototype.startListeningToDatabase = function () {
        var _this = this;
        this.table.on("INSERT", Meteor.bindEnvironment(function (rows) {
            rows.forEach(function (row) {
                var _newPureItem = _this.table.objectFromRow(row);
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
    Object.defineProperty(MeteorCollection.prototype, "rawCollection", {
        get: function () {
            return this.collection;
        },
        enumerable: true,
        configurable: true
    });
    MeteorCollection.prototype.fill = function (criteriaRawJsObject) {
        var _this = this;
        var future = new Future;
        this.table.find(criteriaRawJsObject).then(Meteor.bindEnvironment(function (results) {
            results.forEach(function (result) {
                _this.collection.insert(result);
            });
            future.return();
        }));
        return future.wait();
    };
    MeteorCollection.prototype.fillAll = function () {
        var _this = this;
        var future = new Future;
        this.table.findAll().then(Meteor.bindEnvironment(function (results) {
            results.forEach(function (result) {
                _this.collection.insert(result);
            });
            future.return();
        }));
        return future.wait();
    };
    MeteorCollection.prototype.fillOne = function (criteriaRawJsObject) {
        var _this = this;
        var future = new Future;
        this.table.findSingle(criteriaRawJsObject).then(Meteor.bindEnvironment(function (result) {
            _this.collection.insert(result);
            future.return();
        }));
        return future.wait();
    };
    MeteorCollection.prototype.allow = function (options) {
        return this.collection.allow(options);
    };
    MeteorCollection.prototype.deny = function (options) {
        return this.collection.deny(options);
    };
    MeteorCollection.prototype.find = function (selector, options) {
        return this.collection.find(selector, options);
    };
    ;
    MeteorCollection.prototype.findOne = function (selector, options) {
        return this.collection.findOne(selector, options);
    };
    ;
    return MeteorCollection;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MeteorCollection;
