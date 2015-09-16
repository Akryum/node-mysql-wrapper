﻿import Connection from "./Connection";
import Helper from "./Helper";
import {ICriteriaParts, CriteriaDivider} from "./CriteriaDivider";
import {SelectQueryRules, RawRules, TABLE_RULES_PROPERTY} from "./queries/SelectQueryRules";
import SelectQuery from "./queries/SelectQuery";
import SaveQuery from "./queries/SaveQuery";
import {default as DeleteQuery, DeleteAnswer} from "./queries/DeleteQuery";
import CriteriaBuilder from "./CriteriaBuilder";
import ObservableCollection from "./ObservableCollection";

import * as Promise from 'bluebird';

class Table<T> {
    private _name: string;
    private _connection: Connection;
    private _columns: string[];
    private _primaryKey: string;
    private _criteriaDivider: CriteriaDivider<T>;
    private _rules: SelectQueryRules;
    private _selectQuery: SelectQuery<T>
    private _saveQuery: SaveQuery<T>;
    private _deleteQuery: DeleteQuery<T>;
    private _observableCollection: ObservableCollection<T>;

    constructor(tableName: string, connection: Connection) {
        this._name = tableName;
        this._connection = connection;
        this._criteriaDivider = new CriteriaDivider<T>(this);
        this._rules = new SelectQueryRules();
        this._selectQuery = new SelectQuery(this);
        this._saveQuery = new SaveQuery(this);
        this._deleteQuery = new DeleteQuery(this);
    }

    set columns(cols: string[]) {
        this._columns = cols;
    }

    get columns() {
        return this._columns;
    }

    set primaryKey(prkey: string) {
        this._primaryKey = prkey;
    }

    get primaryKey() {
        return this._primaryKey;
    }

    get connection(): Connection {
        return this._connection;
    }

    get name(): string {
        return this._name;
    }

    set rules(_rules: SelectQueryRules) {
        this._rules = _rules;
    }
    get rules(): SelectQueryRules {
        return this._rules;
    }

    get criteriaDivider(): CriteriaDivider<T> {
        return this._criteriaDivider;
    }

    get criteria(): CriteriaBuilder<T> {
        return new CriteriaBuilder<T>(this);
    }
    
    /**
    * Returns the ObservableCollection if first .observe(true)/observe() has been called, otherwise returns undefined.
    */
    get observer(): ObservableCollection<T> {
        return this._observableCollection;
    }

    get isObservable(): boolean {
        return this._observableCollection !== undefined && this._observableCollection.isObservable;
    }

    on(evtType: string, callback: (parsedResults: any[]) => void): void {
        this.connection.watch(this.name, evtType, callback);
    }

    off(evtType: string, callbackToRemove: (parsedResults: any[]) => void): void {
        this.connection.unwatch(this.name, evtType, callbackToRemove);
    }

    observe(trueOrFalse?: boolean): ObservableCollection<T> {
        if ((trueOrFalse === void 0 || trueOrFalse) && this._observableCollection === undefined) { //or undefined ofc/void 0
            this._observableCollection = new ObservableCollection<T>(this);
        } else if (this._observableCollection !== undefined) {
            //but false
            this._observableCollection.forgetItem();// no params = forget all.
            this._observableCollection = undefined;
        }
        return this._observableCollection;
    }

    has(extendedFunctionName: string): boolean {
        return this[extendedFunctionName] !== undefined;
    }

    extend(functionName: string, theFunction: (...args: any[]) => any): void {

        let isFunction = !!(theFunction && theFunction.constructor && theFunction.call && theFunction.apply);
        if (isFunction) {
            this[functionName] = theFunction;
        }

    }

    objectFromRow(row: any): any {
        let obj = {};
        Helper.forEachKey(row, (key) => {
            if (this.columns.indexOf(key) !== -1 || this.primaryKey === key) {
                obj[Helper.toObjectProperty(key)] = row[key];
            } else {
                obj[key] = row[key]; //for no db properties.
            }
        });
        return obj;
    }

    rowFromObject(obj: any): any {
        let row = {};
        Helper.forEachKey(obj, (key) => {
            let rowKey = Helper.toRowProperty(key);
            if (this.columns.indexOf(rowKey) !== -1 || this.primaryKey === rowKey) {
                row[rowKey] = obj[key];
            }
        });
        return row;
    }

    getRowAsArray(jsObject: any): Array<any> {
        let _arr = new Array();
        let _columns = [];
        let _values = [];
        //'of' doesnt works for the properties.
        Helper.forEachKey(jsObject, (key) => {
            let _col = Helper.toRowProperty(key);
            //only if this key/property of object is actualy a column (except  primary key)

            if (this.columns.indexOf(_col) !== -1) {
                _columns.push(_col);
                _values.push(jsObject[key]);

            }
        });


        _arr.push(_columns);
        _arr.push(_values);

        return _arr;

    }

    getPrimaryKeyValue(jsObject: any): number|string {
        let returnValue: string|number = 0;
        let primaryKeyObjectProperty = Helper.toObjectProperty(this.primaryKey);
        if (jsObject) {
            if (jsObject.constructor === Array) {

            }
            else if (Helper.isString(jsObject) || Helper.isNumber(jsObject)) { //is already ID:string or number 
                return jsObject;
            }
            else { //is raw criteria object
           
                if (jsObject.hasOwnProperty(primaryKeyObjectProperty) || jsObject[primaryKeyObjectProperty] !== undefined) { //auto to || to evala gt exw arxisei na kanw to observable property...pou to emurable einai false.
                    returnValue = jsObject[primaryKeyObjectProperty];

                } else {
                    returnValue = 0;
                }

            }
        }
        return returnValue;
    }
    
    //(Greek-forme)edw exoume tis epiloges: i to kanw na epistrefei kana tablerule i vazw san 3o optional parameter to tablerules, den kserw 9a to dw meta.
    find(criteriaRawJsObject: any): Promise<T[]>; // only criteria and promise
    find(criteriaRawJsObject: any, callback: ((_results: T[]) => any)): Promise<T[]>; // only callback
    find(criteriaRawJsObject?: any, callback?: (_results: T[]) => any): Promise<T[]> {
        return this._selectQuery.execute(criteriaRawJsObject, callback);
    }

    findSingle(criteriaRawJsObject: any, callback?: (_result: T) => any): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.find(criteriaRawJsObject).then(results=> {
                resolve(results[0]);
                if (callback) {
                    callback(results[0]);
                }
            });

        });
    }

    findById(id: number|string): Promise<T>; // without callback
    findById(id: number|string, callback?: (result: T) => any): Promise<T> {

        return new Promise<T>((resolve, reject) => {
            let criteria = {};
            criteria[this.primaryKey] = id;

            this.find(criteria).then((results) => { ///TODO: isws xreiastei an tuxei error na valw to .promise().then alla nomizw to fixara vazontas to then any sto selectquery 
                resolve(results[0]);
                if (callback) {
                    callback(results[0]);
                }
            }).catch((err: any) => reject(err));

        });
    }


    findAll(): Promise<T[]>; // only criteria and promise
    findAll(tableRules: RawRules): Promise<T[]> // only rules and promise
    findAll(tableRules?: RawRules, callback?: (_results: T[]) => any): Promise<T[]> {
        let _obj = {};
        if (tableRules !== undefined) {
            _obj[TABLE_RULES_PROPERTY] = tableRules;
        }
        return this.find(_obj, callback);
    }


    save(criteriaRawJsObject: any): Promise<T | any>; //without callback
    save(criteriaRawJsObject: any, callback?: (_result: any) => any): Promise<T | any> {
        return this._saveQuery.execute(criteriaRawJsObject, callback);
    }

    remove(id: number | string); // ID without callback
    remove(criteriaRawObject: any): Promise<DeleteAnswer>; // criteria obj without callback
    remove(criteriaOrID: any | number | string, callback?: (_result: DeleteAnswer) => any): Promise<DeleteAnswer> {
        return this._deleteQuery.execute(criteriaOrID, callback);
    }

}

export default  Table;
