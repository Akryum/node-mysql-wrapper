import Connection from "./lib/Connection";
import Database from "./lib/Database";
import {SelectQueryRules} from "./lib/queries/SelectQueryRules";
import CriteriaBuilder from "./lib/CriteriaBuilder";
import {CollectionChangedAction, default as ObservableCollection} from "./lib/ObservableCollection";
import Helper from "./lib/Helper";
import ObservableObject from "./lib/ObservableObject";
import * as Mysql from "mysql";

if (Function.prototype["name"] === undefined) {
    //works only for function something() {}; no for var something = function(){}
    // Add a custom property to all function values
    // that actually invokes a method to get the value
    Object.defineProperty(Function.prototype, 'name', {
        get: function() {
            return /function ([^(]*)/.exec(this + "")[1];
        }
    });
}

export function wrap(mysqlUrlOrObjectOrMysqlAlreadyConnection: Mysql.IConnection | string, ...useTables: any[]): Database {
    let mysqlCon = new Connection(mysqlUrlOrObjectOrMysqlAlreadyConnection);
    let mysqlDatabase = new Database(mysqlCon);

    if (useTables) {
        mysqlDatabase.useOnly(useTables);
    }

    return mysqlDatabase;
}

export function observable<T>(obj: T): T & ObservableObject {
    return <T & ObservableObject>new ObservableObject(obj);
}

exports.SelectQueryRules = SelectQueryRules;
exports.CriteriaBuilder = CriteriaBuilder;
exports.ObservableObject = ObservableObject;
exports.ObservableCollection = ObservableCollection;
exports.CollectionChangedAction = CollectionChangedAction;
exports.Helper = Helper;
