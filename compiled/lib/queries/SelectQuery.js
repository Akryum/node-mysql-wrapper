import Helper from "../Helper";
import { TABLE_RULES_PROPERTY } from "./SelectQueryRules";
import * as Promise from 'bluebird';
export var EQUAL_TO_PROPERTY_SYMBOL = '=';
class SelectQuery {
    constructor(_table) {
        this._table = _table;
    }
    parseQueryResult(result, criteria) {
        return new Promise((resolve) => {
            let obj = this._table.objectFromRow(result);
            if (criteria.tables.length > 0) {
                let tableFindPromiseList = [];
                criteria.tables.forEach((_tableProperty) => {
                    let table = this._table.connection.table(_tableProperty.tableName);
                    let tablePropertyName = Helper.toObjectProperty(_tableProperty.propertyName);
                    let criteriaJsObject = Helper.copyObject(criteria.rawCriteriaObject[tablePropertyName]);
                    Helper.forEachKey(criteriaJsObject, (propertyName) => {
                        if (criteriaJsObject[propertyName] === EQUAL_TO_PROPERTY_SYMBOL) {
                            criteriaJsObject[propertyName] = result[Helper.toRowProperty(propertyName)];
                        }
                    });
                    let tableFindPromise = table.find(criteriaJsObject);
                    tableFindPromise.then((childResults) => {
                        if (childResults.length === 1 &&
                            Helper.hasRules(criteriaJsObject) && ((criteriaJsObject[TABLE_RULES_PROPERTY].limit !== undefined && criteriaJsObject[TABLE_RULES_PROPERTY].limit === 1) ||
                            (criteriaJsObject[TABLE_RULES_PROPERTY].limitEnd !== undefined && criteriaJsObject[TABLE_RULES_PROPERTY].limitEnd === 1))) {
                            obj[tablePropertyName] = this._table.objectFromRow(childResults[0]);
                        }
                        else {
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
            }
            else {
                resolve(obj);
            }
        });
    }
    promise(rawCriteria, callback) {
        return new Promise((resolve, reject) => {
            var criteria = this._table.criteriaDivider.divide(rawCriteria);
            let query = "SELECT " + criteria.selectFromClause(this._table) + " FROM " + this._table.name + criteria.whereClause + criteria.queryRules.toString();
            this._table.connection.query(query, (error, results) => {
                if (error || !results) {
                    reject(error + ' Error. On find');
                }
                let parseQueryResultsPromises = [];
                results.forEach((result) => {
                    parseQueryResultsPromises.push(this.parseQueryResult(result, criteria));
                });
                Promise.all(parseQueryResultsPromises).then((_objects) => {
                    if (callback !== undefined) {
                        callback(_objects);
                    }
                    resolve(_objects);
                });
            });
        });
    }
    execute(rawCriteria, callback) {
        return this.promise(rawCriteria);
    }
}
export default SelectQuery;
