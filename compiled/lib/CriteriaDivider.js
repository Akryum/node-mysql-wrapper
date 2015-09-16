import Helper from "./Helper";
import { SelectQueryRules, TABLE_RULES_PROPERTY } from "./queries/SelectQueryRules";
export class CriteriaParts {
    constructor(rawCriteriaObject = {}, tables = [], noDatabaseProperties = [], whereClause = "", queryRules) {
        this.rawCriteriaObject = rawCriteriaObject;
        this.tables = tables;
        this.noDatabaseProperties = noDatabaseProperties;
        this.whereClause = whereClause;
        this.queryRules = queryRules;
    }
    selectFromClause(_table) {
        let columnsToSelectString = "*";
        if (this.queryRules.exceptColumns.length > 0) {
            let columnsToSelect = _table.columns;
            this.queryRules.exceptColumns.forEach(col => {
                let exceptColumn = Helper.toRowProperty(col);
                let _colIndex;
                if ((_colIndex = columnsToSelect.indexOf(exceptColumn)) !== -1) {
                    columnsToSelect.splice(_colIndex, 1);
                }
            });
            if (columnsToSelect.length === 1) {
                columnsToSelectString = columnsToSelect[0];
            }
            else {
                columnsToSelectString = columnsToSelect.join(", ");
            }
            columnsToSelectString = _table.primaryKey + ", " + columnsToSelectString;
        }
        return columnsToSelectString;
    }
}
export class CriteriaDivider {
    constructor(table) {
        this._table = table;
    }
    divide(rawCriteriaObject) {
        let _criteria = new CriteriaParts();
        let colsToSearch = [];
        let exceptColumns = [];
        if (Helper.hasRules(rawCriteriaObject)) {
            _criteria.queryRules = SelectQueryRules.fromRawObject(rawCriteriaObject[TABLE_RULES_PROPERTY]);
        }
        else {
            _criteria.queryRules = new SelectQueryRules().from(this._table.rules);
        }
        Helper.forEachKey(rawCriteriaObject, (objectKey) => {
            let colName = Helper.toRowProperty(objectKey);
            if ((this._table.columns.indexOf(colName) !== -1 && _criteria.queryRules.exceptColumns.indexOf(colName) !== -1) || this._table.primaryKey === colName) {
                colsToSearch.push(colName + " = " + this._table.connection.escape(rawCriteriaObject[objectKey]));
            }
            else {
                if (this._table.connection.table(colName) !== undefined) {
                    _criteria.tables.push({ tableName: colName, propertyName: colName });
                }
                else {
                    _criteria.noDatabaseProperties.push(objectKey);
                }
            }
        });
        _criteria.noDatabaseProperties.forEach(key => {
            let prop = rawCriteriaObject[key];
            if (Helper.hasRules(prop)) {
                let realTableName = prop[TABLE_RULES_PROPERTY]["table"];
                if (realTableName !== undefined) {
                    _criteria.tables.push({ tableName: Helper.toRowProperty(realTableName), propertyName: key });
                }
            }
        });
        if (colsToSearch.length > 0) {
            _criteria.whereClause = " WHERE " + colsToSearch.join(" AND ");
        }
        return _criteria;
    }
}
