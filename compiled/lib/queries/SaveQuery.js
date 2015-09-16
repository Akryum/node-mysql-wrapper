import Helper from "../Helper";
class SaveQuery {
    constructor(_table) {
        this._table = _table;
    }
    execute(criteriaRawJsObject, callback) {
        return new Promise((resolve, reject) => {
            let primaryKeyValue = this._table.getPrimaryKeyValue(criteriaRawJsObject);
            let arr = this._table.getRowAsArray(criteriaRawJsObject);
            let objectColumns = arr[0];
            let objectValues = arr[1];
            let obj = this._table.objectFromRow(criteriaRawJsObject);
            if (primaryKeyValue > 0) {
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
                    this._table.connection.notice(this._table.name, _query, obj);
                    resolve(obj);
                    if (callback) {
                        callback(obj);
                    }
                });
            }
            else {
                let _query = "INSERT INTO ?? (??) VALUES(?) ";
                this._table.connection.query(_query, (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    let primaryKeyJsObjectProperty = Helper.toObjectProperty(this._table.primaryKey);
                    obj[primaryKeyJsObjectProperty] = result.insertId;
                    primaryKeyValue = result.insertId;
                    this._table.connection.notice(this._table.name, _query, obj);
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
