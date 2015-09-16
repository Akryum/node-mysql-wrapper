import Helper from "./Helper";
import { CriteriaDivider } from "./CriteriaDivider";
import { SelectQueryRules, TABLE_RULES_PROPERTY } from "./queries/SelectQueryRules";
import SelectQuery from "./queries/SelectQuery";
import SaveQuery from "./queries/SaveQuery";
import { default as DeleteQuery } from "./queries/DeleteQuery";
import CriteriaBuilder from "./CriteriaBuilder";
import * as Promise from 'bluebird';
class Table {
    constructor(tableName, connection) {
        this._name = tableName;
        this._connection = connection;
        this._criteriaDivider = new CriteriaDivider(this);
        this._rules = new SelectQueryRules();
        this._selectQuery = new SelectQuery(this);
        this._saveQuery = new SaveQuery(this);
        this._deleteQuery = new DeleteQuery(this);
    }
    set columns(cols) {
        this._columns = cols;
    }
    get columns() {
        return this._columns;
    }
    set primaryKey(prkey) {
        this._primaryKey = prkey;
    }
    get primaryKey() {
        return this._primaryKey;
    }
    get connection() {
        return this._connection;
    }
    get name() {
        return this._name;
    }
    set rules(_rules) {
        this._rules = _rules;
    }
    get rules() {
        return this._rules;
    }
    get criteriaDivider() {
        return this._criteriaDivider;
    }
    get criteria() {
        return new CriteriaBuilder(this);
    }
    on(evtType, callback) {
        this.connection.watch(this.name, evtType, callback);
    }
    off(evtType, callbackToRemove) {
        this.connection.unwatch(this.name, evtType, callbackToRemove);
    }
    has(extendedFunctionName) {
        return this[extendedFunctionName] !== undefined;
    }
    extend(functionName, theFunction) {
        let isFunction = !!(theFunction && theFunction.constructor && theFunction.call && theFunction.apply);
        if (isFunction) {
            this[functionName] = theFunction;
        }
    }
    objectFromRow(row) {
        let obj = {};
        Helper.forEachKey(row, (key) => {
            if (this.columns.indexOf(key) !== -1 || this.primaryKey === key) {
                obj[Helper.toObjectProperty(key)] = row[key];
            }
            else {
                obj[key] = row[key];
            }
        });
        return obj;
    }
    rowFromObject(obj) {
        let row = {};
        Helper.forEachKey(obj, (key) => {
            let rowKey = Helper.toRowProperty(key);
            if (this.columns.indexOf(rowKey) !== -1 || this.primaryKey === rowKey) {
                row[rowKey] = obj[key];
            }
        });
        return row;
    }
    getRowAsArray(jsObject) {
        let _arr = new Array();
        let _columns = [];
        let _values = [];
        Helper.forEachKey(jsObject, (key) => {
            let _col = Helper.toRowProperty(key);
            if (this.columns.indexOf(_col) !== -1) {
                _columns.push(_col);
                _values.push(jsObject[key]);
            }
        });
        _arr.push(_columns);
        _arr.push(_values);
        return _arr;
    }
    getPrimaryKeyValue(jsObject) {
        let returnValue = 0;
        let primaryKeyObjectProperty = Helper.toObjectProperty(this.primaryKey);
        if (jsObject) {
            if (jsObject.constructor === Array) {
            }
            else if (Helper.isString(jsObject) || Helper.isNumber(jsObject)) {
                return jsObject;
            }
            else {
                if (jsObject.hasOwnProperty(primaryKeyObjectProperty) || jsObject[primaryKeyObjectProperty] !== undefined) {
                    returnValue = jsObject[primaryKeyObjectProperty];
                }
                else {
                    returnValue = 0;
                }
            }
        }
        return returnValue;
    }
    find(criteriaRawJsObject, callback) {
        return this._selectQuery.execute(criteriaRawJsObject, callback);
    }
    findSingle(criteriaRawJsObject, callback) {
        return new Promise((resolve, reject) => {
            this.find(criteriaRawJsObject).then(results => {
                resolve(results[0]);
                if (callback) {
                    callback(results[0]);
                }
            });
        });
    }
    findById(id, callback) {
        return new Promise((resolve, reject) => {
            let criteria = {};
            criteria[this.primaryKey] = id;
            this.find(criteria).then((results) => {
                resolve(results[0]);
                if (callback) {
                    callback(results[0]);
                }
            }).catch((err) => reject(err));
        });
    }
    findAll(tableRules, callback) {
        let _obj = {};
        if (tableRules !== undefined) {
            _obj[TABLE_RULES_PROPERTY] = tableRules;
        }
        return this.find(_obj, callback);
    }
    save(criteriaRawJsObject, callback) {
        return this._saveQuery.execute(criteriaRawJsObject, callback);
    }
    remove(criteriaOrID, callback) {
        return this._deleteQuery.execute(criteriaOrID, callback);
    }
}
export default Table;
