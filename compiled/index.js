var Connection_1 = require("./lib/Connection");
var Database_1 = require("./lib/Database");
var SelectQueryRules_1 = require("./lib/queries/SelectQueryRules");
var CriteriaBuilder_1 = require("./lib/CriteriaBuilder");
var BaseCollection_1 = require("./lib/BaseCollection");
var Helper_1 = require("./lib/Helper");
var ObservableObject_1 = require("./lib/ObservableObject");
if (Function.prototype["name"] === undefined) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function () {
            return /function ([^(]*)/.exec(this + "")[1];
        }
    });
}
function wrap(mysqlUrlOrObjectOrMysqlAlreadyConnection) {
    var useTables = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        useTables[_i - 1] = arguments[_i];
    }
    var mysqlCon = new Connection_1.default(mysqlUrlOrObjectOrMysqlAlreadyConnection);
    var mysqlDatabase = new Database_1.default(mysqlCon);
    if (useTables && useTables !== null) {
        mysqlDatabase.useOnly(useTables);
    }
    return mysqlDatabase;
}
exports.wrap = wrap;
function observable(obj) {
    return new ObservableObject_1.default(obj);
}
exports.observable = observable;
exports.SelectQueryRules = SelectQueryRules_1.SelectQueryRules;
exports.CriteriaBuilder = CriteriaBuilder_1.default;
exports.ObservableObject = ObservableObject_1.default;
exports.CollectionChangedAction = BaseCollection_1.CollectionChangedAction;
exports.Helper = Helper_1.default;
