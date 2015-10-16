import Table from "./Table";
import {SelectQueryRules, TABLE_RULES_PROPERTY} from "./queries/SelectQueryRules";
import {default as SelectQuery, EQUAL_TO_PROPERTY_SYMBOL} from "./queries/SelectQuery";
import Helper from "./Helper";
import WhereBuilder from "./WhereBuilder";
import * as Promise from 'bluebird';

class CriteriaBuilder<T>{

	private lastWhereBuilderUsed: WhereBuilder<T>;
	public rawCriteria: any = {};

	constructor(primaryTable: Table<T>); //to arxiko apo to Table.ts 9a benei
	constructor(primaryTable: Table<T>, tableName: string, parentBuilder: CriteriaBuilder<any>);// auta 9a benoun apo to parent select query.
	constructor(private primaryTable: Table<T>, private tablePropertyName?: string, private parentBuilder?: CriteriaBuilder<any>) {
		if (parentBuilder !== undefined) {
			this.rawCriteria = parentBuilder.rawCriteria[tablePropertyName];
		}
	}

	where(key: string): WhereBuilder<T> {
		//this.rawCriteria[key] = value;
		//return this;
		this.lastWhereBuilderUsed = new WhereBuilder(this, key);
		return this.lastWhereBuilderUsed;
	}

	or(key?: string): WhereBuilder<T> {
		if (key === undefined && this.lastWhereBuilderUsed === undefined) {
			console.error('CriteriaBuilder or: PLEASE SPECIFY KEY');
			return;
		}
		if (key !== undefined && key.indexOf("or ") >= 0) {

		} else if (key === undefined && this.lastWhereBuilderUsed.key.indexOf("or ") >= 0) {
			key = this.lastWhereBuilderUsed.key;
		} else if (key === undefined) {
			key = "or " + this.lastWhereBuilderUsed.key;

		} else {
			key = "or " + key;
		}
		//den afeinw keno gt afinei to divider meta.
		return this.where(key);

	}

	private createRulesIfNotExists() {
		if (!Helper.hasRules(this.rawCriteria)) {
			this.rawCriteria[TABLE_RULES_PROPERTY] = {};
		}
	}

	except(...columns: string[]): CriteriaBuilder<T> {
		if (columns !== undefined) {
			this.createRulesIfNotExists();
			/* its always array lol where is my mind if (Array.isArray(columns)) { //already array
				this.rawCriteria[TABLE_RULES_PROPERTY]["except"] = columns;
			} else { 
				//it's only one but we must pass it as array.
				this.rawCriteria[TABLE_RULES_PROPERTY]["except"] = [columns];
			}*/
			this.rawCriteria[TABLE_RULES_PROPERTY]["except"] = columns;

		}
		return this;
	}
	
	/**
	 * Same as .except(...columns)
	 */
	exclude(...columns: string[]): CriteriaBuilder<T> {
		return this.except(columns.toString());
	}

	orderBy(column: string, desceding: boolean = false): CriteriaBuilder<T> {
		this.createRulesIfNotExists();
		this.rawCriteria[TABLE_RULES_PROPERTY]["orderBy" + (desceding ? "Desc" : "")] = column;
		return this;
	}

	limit(start: number, end?: number): CriteriaBuilder<T> {
		this.createRulesIfNotExists();

		if (end !== undefined && end > start) {
			this.rawCriteria[TABLE_RULES_PROPERTY]["limitStart"] = start;
			this.rawCriteria[TABLE_RULES_PROPERTY]["limitEnd"] = end;
		} else {
			this.rawCriteria[TABLE_RULES_PROPERTY]["limit"] = start;
			//or 
			/*
			this.rawCriteria["tableRules"]["limitStart"] = 0;
			this.rawCriteria["tableRules"]["limitEnd"] = end;
			to idio pragma vgenei sto select query rules toRawObject kai sto toString.
			*/
		}
		return this;
	}

	join(realTableName: string, foreignColumnName: string, thisColumnName?: string): CriteriaBuilder<T> {
		let _joinedTable = {};

		_joinedTable[foreignColumnName] = EQUAL_TO_PROPERTY_SYMBOL + (thisColumnName ? thisColumnName : '');

		this.rawCriteria[realTableName] = _joinedTable;
		return this;
	}

	joinAs(tableNameProperty: string, realTableName: string, foreignColumnName: string, thisColumnName?: string): CriteriaBuilder<T> {

		let _joinedTable = {};
		_joinedTable[foreignColumnName] = EQUAL_TO_PROPERTY_SYMBOL + (thisColumnName ? thisColumnName : '')

		_joinedTable[TABLE_RULES_PROPERTY] = { table: realTableName };

		this.rawCriteria[tableNameProperty] = _joinedTable;
		return this;
	}

	at(tableNameProperty: string): CriteriaBuilder<T> {
		return new CriteriaBuilder<any>(this.primaryTable, tableNameProperty, this);
	}

	parent(): CriteriaBuilder<T> {
		this.parentBuilder.rawCriteria[this.tablePropertyName] = this.rawCriteria; //edw 9elw to join as omws oxi to real table to opoio stin ousia dn xreiazete ...
		return this.parentBuilder;
	}

	original(): CriteriaBuilder<T> {
		if (this.parentBuilder !== undefined) {
			return this.parent().original();
		} else {
			return this;
		}
	}
	
	/**
	 * Auto kanei kuklous mexri na paei sto primary table kai ekei na epistrepsei to sunoliko raw criteria gia execute i kati allo.
	 */
	build(): any {
		if (this.parentBuilder !== undefined) {
			return this.parent().build();
		} else {
			return this.rawCriteria;
		}
		//return this.rawCriteria;
	}

	static from<T>(table: Table<T>): CriteriaBuilder<T> {
		return new CriteriaBuilder(table);
	}


}

export default CriteriaBuilder;