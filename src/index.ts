import Connection from "./lib/Connection";
import Database from "./lib/Database";
import {SelectQueryRules} from "./lib/queries/SelectQueryRules";
import CriteriaBuilder from "./lib/CriteriaBuilder";
import {CollectionChangedAction} from "./lib/ObservableCollection";
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

function extendTypes<T, U>(first: T, second: U): T & U {
    let result = <T & U>{};
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

export function observable<T>(obj: T): T & ObservableObject {
    return extendTypes(obj, new ObservableObject(obj));
}

class User{
    firstname:string;
    lastname:string;
}

exports.SelectQueryRules = SelectQueryRules;
exports.CriteriaBuilder = CriteriaBuilder;
exports.ObservableObject = ObservableObject;
exports.CollectionChangedAction = CollectionChangedAction;
exports.Helper = Helper;
