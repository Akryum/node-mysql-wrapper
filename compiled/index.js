import Connection from "./lib/Connection";
import Database from "./lib/Database";
import { SelectQueryRules } from "./lib/queries/SelectQueryRules";
import CriteriaBuilder from "./lib/CriteriaBuilder";
import { CollectionChangedAction } from "./lib/ObservableCollection";
import Helper from "./lib/Helper";
import ObservableObject from "./lib/ObservableObject";
if (Function.prototype["name"] === undefined) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function () {
            return /function ([^(]*)/.exec(this + "")[1];
        }
    });
}
export function wrap(mysqlUrlOrObjectOrMysqlAlreadyConnection, ...useTables) {
    let mysqlCon = new Connection(mysqlUrlOrObjectOrMysqlAlreadyConnection);
    let mysqlDatabase = new Database(mysqlCon);
    if (useTables) {
        mysqlDatabase.useOnly(useTables);
    }
    return mysqlDatabase;
}
function extendTypes(first, second) {
    let result = {};
    for (let id in first) {
        result[id] = first[id];
    }
    for (let id in second) {
        if (!result.hasOwnProperty(id)) {
            result[id] = second[id];
        }
    }
    return result;
}
export function observable(obj) {
    return extendTypes(obj, new ObservableObject(obj));
}
exports.SelectQueryRules = SelectQueryRules;
exports.CriteriaBuilder = CriteriaBuilder;
exports.ObservableObject = ObservableObject;
exports.CollectionChangedAction = CollectionChangedAction;
exports.Helper = Helper;
