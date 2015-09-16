import { TABLE_RULES_PROPERTY } from "./queries/SelectQueryRules";
import Helper from "./Helper";
class CriteriaBuilder {
    constructor(primaryTable, tablePropertyName, parentBuilder) {
        this.primaryTable = primaryTable;
        this.tablePropertyName = tablePropertyName;
        this.parentBuilder = parentBuilder;
        this.rawCriteria = {};
        if (parentBuilder !== undefined) {
            this.rawCriteria = parentBuilder.rawCriteria[tablePropertyName];
        }
    }
    where(key, value) {
        this.rawCriteria[key] = value;
        return this;
    }
    createRulesIfNotExists() {
        if (!Helper.hasRules(this.rawCriteria)) {
            this.rawCriteria[TABLE_RULES_PROPERTY] = {};
        }
    }
    except(...columns) {
        console.log("\nEXCEPT: ", columns);
        if (columns !== undefined) {
            this.createRulesIfNotExists();
            this.rawCriteria[TABLE_RULES_PROPERTY]["except"] = columns;
        }
        return this;
    }
    exclude(...columns) {
        return this.except(columns.toString());
    }
    orderBy(column, desceding = false) {
        this.createRulesIfNotExists();
        this.rawCriteria[TABLE_RULES_PROPERTY]["orderBy" + (desceding ? "Desc" : "")] = column;
        return this;
    }
    limit(start, end) {
        this.createRulesIfNotExists();
        if (end !== undefined && end > start) {
            this.rawCriteria[TABLE_RULES_PROPERTY]["limitStart"] = start;
            this.rawCriteria[TABLE_RULES_PROPERTY]["limitEnd"] = end;
        }
        else {
            this.rawCriteria[TABLE_RULES_PROPERTY]["limit"] = start;
        }
        return this;
    }
    join(realTableName, foreignColumnName) {
        let _joinedTable = {};
        _joinedTable[foreignColumnName] = "=";
        this.rawCriteria[realTableName] = _joinedTable;
        return this;
    }
    joinAs(tableNameProperty, realTableName, foreignColumnName) {
        //this.childTables.push(tableNameProperty,realTableName);
        //den ginete edw mexri na kanw kai to 'as' sta criteria mesa sto selectquery, to opoio 9a kanw twra.	this.rawCriteria[]
        //this.createRulesIfNotExists();
        let _joinedTable = {};
        _joinedTable[foreignColumnName] = "=";
        _joinedTable[TABLE_RULES_PROPERTY] = { table: realTableName };
        this.rawCriteria[tableNameProperty] = _joinedTable;
        return this;
    }
    at(tableNameProperty) {
        return new CriteriaBuilder(this.primaryTable, tableNameProperty, this);
    }
    parent() {
        this.parentBuilder.rawCriteria[this.tablePropertyName] = this.rawCriteria;
        return this.parentBuilder;
    }
    original() {
        if (this.parentBuilder !== undefined) {
            return this.parent().original();
        }
        else {
            return this;
        }
    }
    build() {
        if (this.parentBuilder !== undefined) {
            return this.parent().build();
        }
        else {
            return this.rawCriteria;
        }
    }
    static from(table) {
        return new CriteriaBuilder(table);
    }
}
export default CriteriaBuilder;
