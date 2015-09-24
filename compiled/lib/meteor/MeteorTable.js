var MeteorCollection_1 = require("./MeteorCollection");
var MeteorTable = (function () {
    function MeteorTable(table) {
        this.table = table;
        if (Meteor) {
            Future = require("fibers/future");
        }
    }
    Object.defineProperty(MeteorTable.prototype, "criteria", {
        get: function () {
            return this.table.criteria;
        },
        enumerable: true,
        configurable: true
    });
    MeteorTable.prototype.insert = function (doc, callback) {
        if (callback) {
            this.table.save(doc, callback);
        }
        else {
            var future = new Future;
            this.table.save(doc).then(function (_result) {
                future.return(_result);
            });
            return future.wait();
        }
    };
    MeteorTable.prototype.remove = function (selector, callback) {
        if (callback) {
            this.table.remove(selector, callback);
        }
        else {
            var future = new Future;
            this.table.remove(selector).then(function (dAnswer) {
                future.return(dAnswer);
            });
            return future.wait();
        }
        return null;
    };
    MeteorTable.prototype.update = function (selector, callback) {
        if (callback) {
            this.table.save(selector, callback);
        }
        else {
            var future = new Future;
            this.table.save(selector).then(function (_result) {
                future.return(_result);
            });
            return future.wait();
        }
    };
    MeteorTable.prototype.collection = function (nameOfCollection, fillWithCriteria) {
        if (fillWithCriteria === void 0) { fillWithCriteria = {}; }
        var col = new MeteorCollection_1.default(this.table, nameOfCollection);
        col.fill(fillWithCriteria);
        return col.rawCollection;
        ;
    };
    return MeteorTable;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MeteorTable;
