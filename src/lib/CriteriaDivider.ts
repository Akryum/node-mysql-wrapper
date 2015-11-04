import Table from "./Table";
import Helper from "./Helper";
import {SelectQueryRules, TABLE_RULES_PROPERTY} from "./queries/SelectQueryRules";
import {COMPARISON_SYMBOLS} from "./WhereBuilder";

export type TableToSearchPart =  { tableName: string, propertyName: string };

export interface ICriteriaParts {
    rawCriteriaObject: any;
    tables: TableToSearchPart[];
    noDatabaseProperties: string[];
    whereClause: string;
    queryRules: SelectQueryRules;

    selectFromClause<T>(_table: Table<T>): string;
}

export class CriteriaParts implements ICriteriaParts {
    constructor(public rawCriteriaObject: any = {}, public tables: TableToSearchPart[] = [], public noDatabaseProperties: string[] = [], public whereClause: string = "", public queryRules?: SelectQueryRules) {

    }

    selectFromClause<T>(_table: Table<T>): string {
        let columnsToSelectString = "*";

        if (this.queryRules.exceptColumns.length > 0) {

            let columnsToSelect: string[] = _table.columns;

            this.queryRules.exceptColumns.forEach(col=> {
                let exceptColumn = Helper.toRowProperty(col);
                let _colIndex: number;
                if ((_colIndex = columnsToSelect.indexOf(exceptColumn)) !== -1) {
                    columnsToSelect.splice(_colIndex, 1);

                }
            });
            if (columnsToSelect.length === 1) {
                columnsToSelectString = columnsToSelect[0];

            } else {
                columnsToSelectString = columnsToSelect.join(", ");
            }

            columnsToSelectString = _table.primaryKey + ", " + columnsToSelectString; //always select primary key, primary key is not at table.columns .        
              
        }
        return columnsToSelectString;
    }
}

/**
 * Stoxos autou tou divider einai apla na diaxwrizei ta properties apta objects pou ftiaxnonte eite 'me to xeri' , eite me to criteria builder.
 */

export class CriteriaDivider<T> {
    private _table: Table<T>;

    constructor(table: Table<T>) {
        this._table = table;
    }

    divide(rawCriteriaObject: any): CriteriaParts {
        let _criteria: CriteriaParts = new CriteriaParts();

        let colsToSearch: string[] = [];
        let exceptColumns: string[] = [];

        if (Helper.hasRules(rawCriteriaObject)) {
            _criteria.queryRules = SelectQueryRules.fromRawObject(rawCriteriaObject[TABLE_RULES_PROPERTY]);
        } else {
            _criteria.queryRules = new SelectQueryRules().from(this._table.rules);
        }

        Helper.forEachKey(rawCriteriaObject, (objectKey) => {

            let colName = Helper.toRowProperty(objectKey);
            //auto edw MONO,apla dn afinei na boun sta .where columns pou exoun ginei except gia na min uparksoun mysql query errors.
            if ((this._table.columns.indexOf(colName) !== -1 && _criteria.queryRules.exceptColumns.indexOf(colName) === -1) || this._table.primaryKey === colName || colName.split(" ")[0] === "or") {
               //|| (Helper.isString(rawCriteriaObject[colName]) && rawCriteriaObject[colName].split(" ")[0] ==="IN(" ) ) {
                let _valToPut = rawCriteriaObject[objectKey];

                if (Helper.isString(_valToPut)) {



                    let _splitedVal = _valToPut.split(" ");
                    if (_splitedVal[0] === "IN(") {
                        colsToSearch.push(colName +" "+ _valToPut);
                    } else {
                        if (COMPARISON_SYMBOLS.indexOf(_splitedVal[0])) {//checks the  >,<,>=,<=,=,<>
                            colsToSearch.push(colName + _splitedVal[0] + this._table.connection.escape(_valToPut.substring(_splitedVal[0].length + 1)));
                        }
                    }


                } else { //is eq by default but no builded with the criteria builder.
                    colsToSearch.push(colName + "= " + this._table.connection.escape(rawCriteriaObject[objectKey]));
                }
  
                //   colsToSearch.push(colName  + this._table.connection.escape(rawCriteriaObject[objectKey]));
            } else {
                if (this._table.connection.table(colName) !== undefined) {
                    _criteria.tables.push({ tableName: colName, propertyName: colName });
                } else {
                    _criteria.noDatabaseProperties.push(objectKey);
                }
            }
        });
        
        //check for table-as(join as ) property tables from no db properties
        
        _criteria.noDatabaseProperties.forEach(key=> {
            let prop = rawCriteriaObject[key];
            if (Helper.hasRules(prop)) {
                let realTableName = prop[TABLE_RULES_PROPERTY]["table"];
                if (realTableName !== undefined) {
                    _criteria.tables.push({ tableName: Helper.toRowProperty(realTableName), propertyName: key });
                    //maybe I need to remove this key from noDbProperties in the future
                    //_criteria.noDatabaseProperties.splice(_criteria.noDatabaseProperties.indexOf(key));
                
                }
            }

        });
        _criteria.rawCriteriaObject = rawCriteriaObject;
        if (colsToSearch.length > 0) {
            //edw epidi exw kai OR dn borw na to kanw opws prin:   _criteria.whereClause = " WHERE " + colsToSearch.join(" AND ");
            
            _criteria.whereClause = " WHERE ";
            for (let i = 0; i < colsToSearch.length; i++) {
                let _colToSearch = colsToSearch[i];
                let orIndex = _colToSearch.indexOf("or ");
                if (orIndex === 0) { // na mhn einai kai opou nane ..
                    _criteria.whereClause += " " + _colToSearch + " ";
                } else {
                    _criteria.whereClause += (i >= 1 && i < colsToSearch.length ? " AND " + _colToSearch + " " : _colToSearch);
                }

            }


        }

        return _criteria;
    }
}
