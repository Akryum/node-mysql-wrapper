var Helper_1 = require("../Helper");
var ConditionalConverter_1 = require("../ConditionalConverter");
var LiveHelper = (function () {
    function LiveHelper() {
    }
    LiveHelper.canInsert = function (objRow, rawCriteria, joinedRow) {
        var canInsert = true;
        Helper_1.default.forEachKey(rawCriteria, function (key) {
            if (!canInsert) {
                return;
            }
            try {
                if (objRow[key] !== undefined) {
                    var _valCriteria = rawCriteria[key];
                    var _valSplited = _valCriteria.split(" ");
                    if (_valSplited[0] === "IN(") {
                        var _values = _valCriteria.substring(_valSplited[0].length, _valCriteria.lastIndexOf(")")).split(",");
                        _values = " " + objRow[key] + " === " + _values.join("|| " + objRow[key] + " === ");
                        if (!eval(_values)) {
                            canInsert = false;
                        }
                    }
                    else {
                        var _symbolCombarison = ConditionalConverter_1.default.toJS(_valSplited[0]);
                        var valComparison = _valSplited[1];
                        var ifEvalStatementStr = objRow[key] + _symbolCombarison + valComparison;
                        ifEvalStatementStr = ConditionalConverter_1.default.toJSConditional(ifEvalStatementStr);
                        if (!eval(ifEvalStatementStr)) {
                            canInsert = false;
                        }
                    }
                }
            }
            catch (ex) {
                canInsert = false;
            }
        });
        return canInsert;
    };
    LiveHelper.listenToTable = function (table, collectionArray, criteriaRawJsObject, action) {
        var criteria = table.criteriaDivider.divide(criteriaRawJsObject);
        criteria.tables.forEach(function (_tb) {
            var joinedTableObj = table.connection.table(_tb.tableName);
            var joinedTableCriteria = joinedTableObj.criteriaDivider.divide(criteria.rawCriteriaObject[_tb.propertyName]);
            joinedTableObj.on("INSERT", function (rows) {
                rows.forEach(function (row) {
                    var objRow = joinedTableObj.objectFromRow(row);
                    collectionArray.forEach(function (_objInlist) {
                        var joinedCriteria = {};
                        Helper_1.default.forEachKey(joinedTableCriteria.rawCriteriaObject, function (key) {
                            try {
                                var valWithoutComparison = joinedTableCriteria.rawCriteriaObject[key].split(" ")[1];
                                var valComparisonSymbol = joinedTableCriteria.rawCriteriaObject[key].split(" ")[0];
                                if (_objInlist[valWithoutComparison] !== undefined) {
                                    joinedCriteria[key] = valComparisonSymbol + " " + _objInlist[valWithoutComparison];
                                }
                            }
                            catch (ex) {
                            }
                        });
                        var canInsert = LiveHelper.canInsert(objRow, joinedCriteria);
                        if (canInsert) {
                            var parentPropName = _tb.propertyName;
                            var primkey = Helper_1.default.toObjectProperty(table.primaryKey);
                            var objToFind = {};
                            objToFind[primkey] = _objInlist[primkey];
                            if (_objInlist[parentPropName] instanceof Array) {
                                _objInlist[parentPropName].push(objRow);
                                action("INSERT", _tb, objRow, objToFind, true);
                            }
                            else {
                                action("INSERT", _tb, objRow, objToFind, false);
                            }
                        }
                    });
                });
            });
            joinedTableObj.on("DELETE", function (rows) {
                rows.forEach(function (row) {
                    var objRow = joinedTableObj.objectFromRow(row);
                    var toBeRemovedCriteria = {};
                    toBeRemovedCriteria[Helper_1.default.toObjectProperty(joinedTableObj.primaryKey)] = row[joinedTableObj.primaryKey];
                    var isArray = false;
                    if (joinedTableCriteria === undefined || joinedTableCriteria.queryRules === undefined ||
                        (joinedTableCriteria.queryRules !== undefined && ((joinedTableCriteria.queryRules.limitEnd - joinedTableCriteria.queryRules.limitStart) !== 1))) {
                        isArray = true;
                    }
                    action("DELETE", _tb, objRow, toBeRemovedCriteria, isArray);
                });
            });
            joinedTableObj.on("UPDATE", function (rows) {
                rows.forEach(function (row) {
                    var rowUpdated = row["after"];
                    var objRow = joinedTableObj.objectFromRow(rowUpdated);
                    var toBeUpdatedCriteria = {};
                    toBeUpdatedCriteria[Helper_1.default.toObjectProperty(joinedTableObj.primaryKey)] = row[joinedTableObj.primaryKey];
                    var isArray = false;
                    if (joinedTableCriteria === undefined || joinedTableCriteria.queryRules === undefined ||
                        (joinedTableCriteria.queryRules !== undefined && ((joinedTableCriteria.queryRules.limitEnd - joinedTableCriteria.queryRules.limitStart) !== 1))) {
                        isArray = true;
                    }
                    action("UPDATE", _tb, objRow, toBeUpdatedCriteria, isArray);
                });
            });
        });
    };
    return LiveHelper;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LiveHelper;
