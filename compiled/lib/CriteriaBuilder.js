var SelectQueryRules_1 = require("./queries/SelectQueryRules");
var SelectQuery_1 = require("./queries/SelectQuery");
var Helper_1 = require("./Helper");
var CriteriaBuilder = (function () {
    function CriteriaBuilder(primaryTable, tablePropertyName, parentBuilder) {
        this.primaryTable = primaryTable;
        this.tablePropertyName = tablePropertyName;
        this.parentBuilder = parentBuilder;
        this.rawCriteria = {};
        if (parentBuilder !== undefined) {
            this.rawCriteria = parentBuilder.rawCriteria[tablePropertyName];
        }
    }
    CriteriaBuilder.prototype.where = function (key, value) {
        this.rawCriteria[key] = value;
        return this;
    };
    CriteriaBuilder.prototype.createRulesIfNotExists = function () {
        if (!Helper_1.default.hasRules(this.rawCriteria)) {
            this.rawCriteria[SelectQueryRules_1.TABLE_RULES_PROPERTY] = {};
        }
    };
    CriteriaBuilder.prototype.except = function () {
        var columns = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            columns[_i - 0] = arguments[_i];
        }
        if (columns !== undefined) {
            this.createRulesIfNotExists();
            this.rawCriteria[SelectQueryRules_1.TABLE_RULES_PROPERTY]["except"] = columns;
        }
        return this;
    };
    CriteriaBuilder.prototype.exclude = function () {
        var columns = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            columns[_i - 0] = arguments[_i];
        }
        return this.except(columns.toString());
    };
    CriteriaBuilder.prototype.orderBy = function (column, desceding) {
        if (desceding === void 0) { desceding = false; }
        this.createRulesIfNotExists();
        this.rawCriteria[SelectQueryRules_1.TABLE_RULES_PROPERTY]["orderBy" + (desceding ? "Desc" : "")] = column;
        return this;
    };
    CriteriaBuilder.prototype.limit = function (start, end) {
        this.createRulesIfNotExists();
        if (end !== undefined && end > start) {
            this.rawCriteria[SelectQueryRules_1.TABLE_RULES_PROPERTY]["limitStart"] = start;
            this.rawCriteria[SelectQueryRules_1.TABLE_RULES_PROPERTY]["limitEnd"] = end;
        }
        else {
            this.rawCriteria[SelectQueryRules_1.TABLE_RULES_PROPERTY]["limit"] = start;
        }
        return this;
    };
    CriteriaBuilder.prototype.join = function (realTableName, foreignColumnName, thisColumnName) {
        var _joinedTable = {};
        _joinedTable[foreignColumnName] = SelectQuery_1.EQUAL_TO_PROPERTY_SYMBOL + (thisColumnName ? thisColumnName : '');
        this.rawCriteria[realTableName] = _joinedTable;
        return this;
    };
    CriteriaBuilder.prototype.joinAs = function (tableNameProperty, realTableName, foreignColumnName, thisColumnName) {
        var _joinedTable = {};
        _joinedTable[foreignColumnName] = SelectQuery_1.EQUAL_TO_PROPERTY_SYMBOL + (thisColumnName ? thisColumnName : '');
        _joinedTable[SelectQueryRules_1.TABLE_RULES_PROPERTY] = { table: realTableName };
        this.rawCriteria[tableNameProperty] = _joinedTable;
        return this;
    };
    CriteriaBuilder.prototype.at = function (tableNameProperty) {
        return new CriteriaBuilder(this.primaryTable, tableNameProperty, this);
    };
    CriteriaBuilder.prototype.parent = function () {
        this.parentBuilder.rawCriteria[this.tablePropertyName] = this.rawCriteria;
        return this.parentBuilder;
    };
    CriteriaBuilder.prototype.original = function () {
        if (this.parentBuilder !== undefined) {
            return this.parent().original();
        }
        else {
            return this;
        }
    };
    CriteriaBuilder.prototype.build = function () {
        if (this.parentBuilder !== undefined) {
            return this.parent().build();
        }
        else {
            return this.rawCriteria;
        }
    };
    CriteriaBuilder.from = function (table) {
        return new CriteriaBuilder(table);
    };
    return CriteriaBuilder;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CriteriaBuilder;
