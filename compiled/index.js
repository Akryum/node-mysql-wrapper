var Connection_1 = require("./lib/Connection");
var Wrapper_1 = require("./lib/Wrapper");
var SelectQueryRules_1 = require("./lib/queries/SelectQueryRules");
var CriteriaBuilder_1 = require("./lib/CriteriaBuilder");
var ObservableCollection_1 = require("./lib/ObservableCollection");
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
    var mysqlWrapper = new Wrapper_1.default(mysqlCon);
    if (useTables) {
        mysqlWrapper.useOnly(useTables);
    }
    return mysqlWrapper;
}
exports.wrap = wrap;
exports.SelectQueryRules = SelectQueryRules_1.SelectQueryRules;
exports.CriteriaBuilder = CriteriaBuilder_1.default;
exports.ObservableObject = ObservableObject_1.default;
exports.CollectionChangedAction = ObservableCollection_1.CollectionChangedAction;
exports.Helper = Helper_1.default;
