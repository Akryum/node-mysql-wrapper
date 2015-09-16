class DeleteQuery {
    constructor(_table) {
        this._table = _table;
    }
    execute(criteriaOrID, callback) {
        return new Promise((resolve, reject) => {
            let primaryKeyValue = this._table.getPrimaryKeyValue(criteriaOrID);
            if (!primaryKeyValue || primaryKeyValue <= 0) {
                let arr = this._table.getRowAsArray(criteriaOrID);
                let objectValues = arr[1];
                let colummnsAndValues = [];
                for (let i = 0; i < colummnsAndValues.length; i++) {
                    colummnsAndValues.push(colummnsAndValues[i] + "=" + this._table.connection.escape(objectValues[i]));
                }
                if (colummnsAndValues.length === 0) {
                    reject('No criteria found in model! ');
                }
                let _query = "DELETE FROM " + this._table.name + " WHERE " + colummnsAndValues.join(' AND ');
                this._table.connection.query(_query, (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    let _objReturned = { affectedRows: result.affectedRows, table: this._table.name };
                    this._table.connection.notice(this._table.name, _query, [_objReturned]);
                    resolve(_objReturned);
                    if (callback) {
                        callback(_objReturned);
                    }
                });
            }
            else {
                let _query = "DELETE FROM " + this._table.name + " WHERE " + this._table.primaryKey + " = " + criteriaOrID;
                this._table.connection.query(_query, (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    let _objReturned = { affectedRows: result.affectedRows, table: this._table.name };
                    this._table.connection.notice(this._table.name, _query, [_objReturned]);
                    resolve(_objReturned);
                    if (callback) {
                        callback(_objReturned);
                    }
                });
            }
        });
    }
}
export default DeleteQuery;
