var Helper_1 = require("./Helper");
var SelectQueryRules_1 = require("./queries/SelectQueryRules");
var WhereBuilder_1 = require("./WhereBuilder");
var CriteriaParts = (function () {
    function CriteriaParts(rawCriteriaObject, tables, noDatabaseProperties, whereClause, queryRules) {
        if (rawCriteriaObject === void 0) { rawCriteriaObject = {}; }
        if (tables === void 0) { tables = []; }
        if (noDatabaseProperties === void 0) { noDatabaseProperties = []; }
        if (whereClause === void 0) { whereClause = ""; }
        this.rawCriteriaObject = rawCriteriaObject;
        this.tables = tables;
        this.noDatabaseProperties = noDatabaseProperties;
        this.whereClause = whereClause;
        this.queryRules = queryRules;
    }
    CriteriaParts.prototype.selectFromClause = function (_table) {
        var columnsToSelectString = "*";
        if (this.queryRules.exceptColumns.length > 0) {
            var columnsToSelect = _table.columns;
            this.queryRules.exceptColumns.forEach(function (col) {
                var exceptColumn = Helper_1.default.toRowProperty(col);
                var _colIndex;
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
    };
    return CriteriaParts;
})();
exports.CriteriaParts = CriteriaParts;
var CriteriaDivider = (function () {
    function CriteriaDivider(table) {
        this._table = table;
    }
    CriteriaDivider.prototype.divide = function (rawCriteriaObject) {
        var _this = this;
        var _criteria = new CriteriaParts();
        var colsToSearch = [];
        var exceptColumns = [];
        if (Helper_1.default.hasRules(rawCriteriaObject)) {
            _criteria.queryRules = SelectQueryRules_1.SelectQueryRules.fromRawObject(rawCriteriaObject[SelectQueryRules_1.TABLE_RULES_PROPERTY]);
        }
        else {
            _criteria.queryRules = new SelectQueryRules_1.SelectQueryRules().from(this._table.rules);
        }
        Helper_1.default.forEachKey(rawCriteriaObject, function (objectKey) {
            var colName = Helper_1.default.toRowProperty(objectKey);
            if ((_this._table.columns.indexOf(colName) !== -1 && _criteria.queryRules.exceptColumns.indexOf(colName) === -1) || _this._table.primaryKey === colName || colName.split(" ")[0] === "or") {
                var _valToPut = rawCriteriaObject[objectKey];
                if (Helper_1.default.isString(_valToPut)) {
                    var _splitedVal = _valToPut.split(" ");
                    if (_splitedVal[0] === "IN(") {
                        colsToSearch.push(colName + " " + _valToPut);
                    }
                    else {
                        if (WhereBuilder_1.COMPARISON_SYMBOLS.indexOf(_splitedVal[0])) {
                            colsToSearch.push(colName + _splitedVal[0] + _this._table.connection.escape(_valToPut.substring(_splitedVal[0].length + 1)));
                        }
                    }
                }
                else {
                    colsToSearch.push(colName + "= " + _this._table.connection.escape(rawCriteriaObject[objectKey]));
                }
            }
            else {
                if (_this._table.connection.table(colName) !== undefined) {
                    _criteria.tables.push({ tableName: colName, propertyName: colName });
                }
                else {
                    _criteria.noDatabaseProperties.push(objectKey);
                }
            }
        });
        _criteria.noDatabaseProperties.forEach(function (key) {
            var prop = rawCriteriaObject[key];
            if (Helper_1.default.hasRules(prop)) {
                var realTableName = prop[SelectQueryRules_1.TABLE_RULES_PROPERTY]["table"];
                if (realTableName !== undefined) {
                    _criteria.tables.push({ tableName: Helper_1.default.toRowProperty(realTableName), propertyName: key });
                }
            }
        });
        _criteria.rawCriteriaObject = rawCriteriaObject;
        if (colsToSearch.length > 0) {
            _criteria.whereClause = " WHERE ";
            for (var i = 0; i < colsToSearch.length; i++) {
                var _colToSearch = colsToSearch[i];
                var orIndex = _colToSearch.indexOf("or ");
                if (orIndex === 0) {
                    _criteria.whereClause += " " + _colToSearch + " ";
                }
                else {
                    _criteria.whereClause += (i >= 1 && i < colsToSearch.length ? " AND " + _colToSearch + " " : _colToSearch);
                }
            }
        }
        return _criteria;
    };
    return CriteriaDivider;
})();
exports.CriteriaDivider = CriteriaDivider;
