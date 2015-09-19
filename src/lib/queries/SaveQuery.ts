import Helper from "../Helper";
import Table from "../Table";
import IQuery from"./IQuery";
import * as Promise from 'bluebird';
class SaveQuery<T> implements IQuery<T> {

    constructor(public _table: Table<T>) {

    }
 
    execute(criteriaRawJsObject: any, callback?: (_result: T | any) => any): Promise<T | any> {
        return new Promise<T | any>((resolve, reject) => {
            let primaryKeyValue = this._table.getPrimaryKeyValue(criteriaRawJsObject);

            //14-08-2015 always run getRowAsArray before save.  if (this.columns.length === 0 || this.values.length === 0) {
            let arr = this._table.getRowAsArray(criteriaRawJsObject);
            let objectColumns = arr[0]; // = columns , 1= values
            let objectValues = arr[1];
            //   }
            let obj = this._table.objectFromRow(criteriaRawJsObject);
            if (primaryKeyValue > 0) {
                //update
                let colummnsAndValuesStr = "";
                for (let i = 0; i < objectColumns.length; i++) {
                    colummnsAndValuesStr += "," + objectColumns[i] + "=" + this._table.connection.escape(objectValues[i]);
                }
                colummnsAndValuesStr = colummnsAndValuesStr.substring(1);
                let _query = "UPDATE " + this._table.name + " SET " + colummnsAndValuesStr + " WHERE " + this._table.primaryKey + " =  " + primaryKeyValue;
                this._table.connection.query(_query, (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    //old this._table.connection.notice(this._table.name, _query, obj);

                    resolve(obj);
                    if (callback) {
                        callback(obj); 
                    }
                });

            } else {
                //create
                let _query = "INSERT INTO ?? (??) VALUES(?) ";
                this._table.connection.query(_query, (err, result) => {
                    if (err) {
                        reject(err);
                    }


                    let primaryKeyJsObjectProperty = Helper.toObjectProperty(this._table.primaryKey);

                    obj[primaryKeyJsObjectProperty] = result.insertId;
                    primaryKeyValue = result.insertId;

                    //old this._table.connection.notice(this._table.name, _query, obj);
                
                    resolve(obj);
                    if (callback) {
                        callback(obj);
                    }


                }, [this._table.name, objectColumns, objectValues]);
            }
        });
    }
}

export default SaveQuery;