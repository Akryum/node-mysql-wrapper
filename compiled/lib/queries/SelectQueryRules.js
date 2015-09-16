import Helper from "../Helper";
export var TABLE_RULES_PROPERTY = "tableRules";
export class SelectQueryRules {
    constructor() {
        this.manuallyEndClause = "";
        this.manuallyBeginClause = "";
        this.orderByColumn = "";
        this.orderByDescColumn = "";
        this.groupByColumn = "";
        this.limitStart = 0;
        this.limitEnd = 0;
        this.tableName = "";
        this.exceptColumns = [];
    }
    static build(parentRule) {
        let _rules = new SelectQueryRules();
        if (parentRule) {
            _rules.from(parentRule);
        }
        return _rules;
    }
    last(propertyClauseName) {
        this.lastPropertyClauseName = propertyClauseName;
    }
    table(realTableName) {
        if (realTableName === undefined || realTableName === "") {
            this.tableName = "";
        }
        else {
            this.tableName = realTableName;
        }
        return this;
    }
    except(...columns) {
        if (columns !== undefined && columns.length > 0) {
            this.exceptColumns = columns;
        }
        else {
            this.exceptColumns = [];
        }
        return this;
    }
    exclude(...columns) {
        return this.except(columns.toString());
    }
    orderBy(columnKey, descending) {
        if (!columnKey || (columnKey !== undefined && columnKey === "")) {
            this.orderByColumn = "";
        }
        else {
            if (descending) {
                this.orderByDescColumn = columnKey;
                this.last("orderByDescColumn");
            }
            else {
                this.orderByColumn = columnKey;
                this.last("orderByColumn");
            }
        }
        return this;
    }
    groupBy(columnKey) {
        if (!columnKey || (columnKey !== undefined && columnKey === "")) {
            this.groupByColumn = "";
        }
        else {
            this.groupByColumn = columnKey;
            this.last("groupByColumn");
        }
        return this;
    }
    limit(limitRowsOrStart, limitEnd) {
        if (limitEnd === undefined && limitRowsOrStart === undefined) {
            this.limitStart = 0;
            this.limitEnd = 0;
        }
        else {
            if (limitEnd !== undefined && limitEnd > limitRowsOrStart) {
                this.limitStart = limitRowsOrStart;
                this.limitEnd = limitEnd;
            }
            else if (limitEnd === undefined) {
                this.limitStart = 0;
                this.limitEnd = limitRowsOrStart;
            }
            this.last("limitEnd");
        }
        return this;
    }
    appendToBegin(manualAfterWhereString) {
        if (manualAfterWhereString !== undefined && manualAfterWhereString.length > 0) {
            this.manuallyBeginClause += manualAfterWhereString;
            this.last("manuallyBeginClause");
        }
        return this;
    }
    appendToEnd(manualAfterWhereString) {
        if (manualAfterWhereString !== undefined && manualAfterWhereString.length > 0) {
            this.manuallyEndClause += manualAfterWhereString;
            this.last("manuallyEndClause");
        }
        return this;
    }
    append(appendToCurrent) {
        if (appendToCurrent !== undefined && appendToCurrent.length > 0) {
            if (this.lastPropertyClauseName !== undefined && this.lastPropertyClauseName.length > 1) {
                this[this.lastPropertyClauseName] += appendToCurrent;
            }
            else {
                this.manuallyBeginClause = appendToCurrent;
            }
        }
        return this;
    }
    clearOrderBy() {
        this.orderByColumn = "";
        this.orderByDescColumn = "";
        return this;
    }
    clearGroupBy() {
        this.groupByColumn = "";
        return this;
    }
    clearLimit() {
        this.limitStart = 0;
        this.limitEnd = 0;
        return this;
    }
    clearEndClause() {
        this.manuallyEndClause = "";
        return this;
    }
    clearBeginClause() {
        this.manuallyBeginClause = "";
        return this;
    }
    clear() {
        this.last("");
        this.tableName = "";
        this.exceptColumns = [];
        return this.clearBeginClause().clearOrderBy().clearGroupBy().clearLimit().clearEndClause();
    }
    from(parentRule) {
        if (this.manuallyBeginClause.length < 1) {
            this.manuallyBeginClause = parentRule.manuallyBeginClause;
        }
        if (this.orderByColumn.length < 1) {
            this.orderByColumn = parentRule.orderByColumn;
        }
        if (this.orderByDescColumn.length < 1) {
            this.orderByDescColumn = parentRule.orderByDescColumn;
        }
        if (this.groupByColumn.length < 1) {
            this.groupByColumn = parentRule.groupByColumn;
        }
        if (this.limitStart === 0 || this.limitEnd === 0) {
            this.limitStart = parentRule.limitStart;
            this.limitEnd = parentRule.limitEnd;
        }
        if (this.manuallyEndClause.length < 1) {
            this.manuallyEndClause = parentRule.manuallyEndClause;
        }
        return this;
    }
    isEmpty() {
        if (this.exceptColumns.length < 1 && this.tableName.length < 1 && this.manuallyBeginClause.length < 1 && this.orderByColumn.length < 1 && this.orderByDescColumn.length < 1 && this.groupByColumn.length < 1
            && this.limitStart === 0 && this.limitEnd === 0 && this.manuallyEndClause.length < 1) {
            return true;
        }
        else {
            return false;
        }
    }
    toString() {
        return SelectQueryRules.toString(this);
    }
    toRawObject() {
        return SelectQueryRules.toRawObject(this);
    }
    static toString(rules) {
        let afterWhere = "";
        let _orderbyClause = "";
        let _groupByClause = rules.groupByColumn.length > 1 ? " GROUP BY " + Helper.toRowProperty(rules.groupByColumn) + " " : "";
        let _limitClause = rules.limitEnd > 0 ? " LIMIT " + rules.limitStart + ", " + rules.limitEnd : "";
        if (rules.orderByColumn.length > 1) {
            _orderbyClause = " ORDER BY " + Helper.toRowProperty(rules.orderByColumn) + " ";
        }
        else if (rules.orderByDescColumn.length > 1) {
            _orderbyClause = " ORDER BY " + Helper.toRowProperty(rules.orderByDescColumn) + " DESC ";
        }
        if (rules.groupByColumn.length > 1 && (rules.orderByColumn.length > 1 || rules.orderByDescColumn.length > 1)) {
            afterWhere = _orderbyClause;
            _groupByClause = "";
        }
        else {
            afterWhere = _orderbyClause + _groupByClause + _limitClause;
        }
        return rules.manuallyBeginClause + afterWhere + rules.manuallyEndClause;
    }
    static toRawObject(rules) {
        if (rules.isEmpty()) {
            return undefined;
        }
        let obj;
        if (rules.tableName.length > 1) {
            obj.table = rules.tableName;
        }
        if (rules.exceptColumns.length > 1) {
            obj.except = rules.exceptColumns;
        }
        if (rules.manuallyBeginClause.length > 1) {
            obj.begin = rules.manuallyBeginClause;
        }
        if (rules.manuallyEndClause.length > 1) {
            obj.end = rules.manuallyEndClause;
        }
        if (rules.orderByColumn.length > 1) {
            obj.orderBy = rules.orderByColumn;
        }
        if (rules.orderByDescColumn.length > 1) {
            obj.orderByDesc = rules.orderByDescColumn;
        }
        if (rules.groupByColumn.length > 1) {
            obj.groupBy = rules.groupByColumn;
        }
        if (rules.limitEnd > 0) {
            obj.limitStart = rules.limitStart;
            obj.limitEnd = rules.limitEnd;
        }
        return obj;
    }
    static fromRawObject(obj) {
        let rules = new SelectQueryRules();
        if (obj.table !== undefined && obj.table.length > 1) {
            rules.table(obj.table);
        }
        rules.appendToBegin(obj.begin);
        if (obj.orderBy !== undefined && obj.orderBy.length > 1) {
            rules.orderBy(obj.orderBy, false);
        }
        else if (obj.orderByDesc !== undefined && obj.orderByDesc.length > 1) {
            rules.orderBy(obj.orderByDesc, true);
        }
        if (obj.limit > 0) {
            if (obj.limitEnd > 0) {
                obj.limitStart = obj.limit;
            }
            else {
                obj.limitStart = 0;
                obj.limitEnd = obj.limit;
            }
        }
        if (obj.except !== undefined) {
            rules.except(obj.except.toString());
        }
        rules.limit(obj.limitStart, obj.limitEnd);
        rules.groupBy(obj.groupBy);
        rules.appendToEnd(obj.end);
        return rules;
    }
}
