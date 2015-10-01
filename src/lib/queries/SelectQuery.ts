import Helper from "../Helper";
import Table from "../Table";
import {SelectQueryRules, TABLE_RULES_PROPERTY} from "./SelectQueryRules";
import {ICriteriaParts} from "../CriteriaDivider";
import CriteriaBuilder from "../CriteriaBuilder";
import IQuery from"./IQuery";
import ObservableObject from "../ObservableObject";
import * as Promise from 'bluebird';

export var EQUAL_TO_PROPERTY_SYMBOL = '=';
export var FIND_EQUAL_BY_PROPERTY_SYMBOL = '&';
class SelectQuery<T> implements IQuery<T> { // T for Table's result type.

    constructor(public _table: Table<T>) {

    }

    private parseQueryResult(result: any, criteria: ICriteriaParts): Promise<any> {
        return new Promise((resolve: (value: any) => void) => {
            let obj = this._table.objectFromRow(result);
            if (criteria.tables.length > 0) {
                let tableFindPromiseList = [];
                //tables to search
                criteria.tables.forEach((_tableProperty) => {
                    let table = this._table.connection.table(_tableProperty.tableName);
                    let tablePropertyName = Helper.toObjectProperty(_tableProperty.propertyName);
                    let criteriaJsObject = Helper.copyObject(criteria.rawCriteriaObject[tablePropertyName]);
                    Helper.forEachKey(criteriaJsObject, (propertyName) => {
                        if (criteriaJsObject[propertyName] === EQUAL_TO_PROPERTY_SYMBOL) {
                            //sindese to X property me to antistixo X property tou reslt
                            criteriaJsObject[propertyName] = result[Helper.toRowProperty(propertyName)];
                        }else if(criteriaJsObject[propertyName] instanceof String &&  (<String>criteriaJsObject[propertyName]).charAt(0) === FIND_EQUAL_BY_PROPERTY_SYMBOL ){
                           //sindese to X property me to antistixo &Y property tou result 
                           criteriaJsObject[propertyName] = result[Helper.toRowProperty((<String>criteriaJsObject[propertyName]).substring(1))];
                           
                        }
                    });
                    let tableFindPromise = table.find(criteriaJsObject);

                    tableFindPromise.then((childResults) => {
                        if (childResults.length === 1 &&
                            Helper.hasRules(criteriaJsObject) && (
                                (criteriaJsObject[TABLE_RULES_PROPERTY].limit !== undefined && criteriaJsObject[TABLE_RULES_PROPERTY].limit === 1) ||
                                (criteriaJsObject[TABLE_RULES_PROPERTY].limitEnd !== undefined && criteriaJsObject[TABLE_RULES_PROPERTY].limitEnd === 1))) {
                            //edw an vriskeis mono ena result ALLA kai o developer epsaxne mono gia ena result, tote min kaneis to property ws array.
                            obj[tablePropertyName] = this._table.objectFromRow(childResults[0]);

                        } else {
                            obj[tablePropertyName] = [];
                            childResults.forEach((childResult) => {
                                obj[tablePropertyName].push(this._table.objectFromRow(childResult));
                            });
                        }
                    });
                    tableFindPromiseList.push(tableFindPromise);

                });

                Promise.all(tableFindPromiseList).then(() => {
                    resolve(obj);
                });

            } else {
                resolve(obj);
            }

        });
    }

    /**
     * Executes the select and returns the Promise.
     */
    promise(rawCriteriaObject: any, callback?: (_results: T[]) => any): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            var rawCriteria: any;
            if (rawCriteriaObject instanceof CriteriaBuilder) {
                rawCriteria = rawCriteriaObject.build();
            } else {
                rawCriteria = rawCriteriaObject;
            }
            var criteria = this._table.criteriaDivider.divide(rawCriteria);
            let query = "SELECT " + criteria.selectFromClause(this._table) + " FROM " + this._table.name + criteria.whereClause + criteria.queryRules.toString();

            this._table.connection.query(query, (error, results: any[]) => {
                if (error || !results) {
                    reject(error + ' Error. On find');
                }
                let parseQueryResultsPromises = [];

                results.forEach((result) => {
                    parseQueryResultsPromises.push(this.parseQueryResult(result, criteria)); //as table name

                });

                Promise.all(parseQueryResultsPromises).then((_objects: T[]) => {
                    if (callback !== undefined) {
                        callback(_objects);
                    }
                    resolve(_objects);
                });

            });
        });

    }

    /**
     * Exactly the same thing as promise().
     * Executes the select and returns the Promise.
    */
    execute(rawCriteria: any, callback?: (_results: T[]) => any): Promise<T[]> {
        return this.promise(rawCriteria);
    }
}

export default SelectQuery;
