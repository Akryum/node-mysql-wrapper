var Helper_1 = require("../Helper");
var SaveQuery = (function () {
    function SaveQuery(_table) {
        this._table = _table;
    }
    SaveQuery.prototype.execute = function (criteriaRawJsObject, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var primaryKeyValue = _this._table.getPrimaryKeyValue(criteriaRawJsObject);
            var arr = _this._table.getRowAsArray(criteriaRawJsObject);
            var objectColumns = arr[0];
            var objectValues = arr[1];
            var obj = _this._table.objectFromRow(criteriaRawJsObject);
            if (primaryKeyValue > 0) {
                var colummnsAndValuesStr = "";
                for (var i = 0; i < objectColumns.length; i++) {
                    colummnsAndValuesStr += "," + objectColumns[i] + "=" + _this._table.connection.escape(objectValues[i]);
                }
                colummnsAndValuesStr = colummnsAndValuesStr.substring(1);
                var _query = "UPDATE " + _this._table.name + " SET " + colummnsAndValuesStr + " WHERE " + _this._table.primaryKey + " =  " + primaryKeyValue;
                _this._table.connection.query(_query, function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    _this._table.connection.notice(_this._table.name, _query, obj);
                    if (_this._table.isObservable) {
                        var _foundObsItem = _this._table.observer.findItem(primaryKeyValue);
                        if (_foundObsItem !== undefined && _foundObsItem.isObservable) {
                            var _propertiesWereChanged = _this._table.observer.getChangedPropertiesOf(obj);
                            _propertiesWereChanged.forEach(function (_propertyChangedName) {
                                var _oldValue = _foundObsItem.item[_propertyChangedName];
                                _foundObsItem.item[_propertyChangedName] = obj[_propertyChangedName];
                                _foundObsItem.notifyPropertyChanged(_propertyChangedName, _oldValue);
                            });
                        }
                    }
                    resolve(obj);
                    if (callback) {
                        callback(obj);
                    }
                });
            }
            else {
                var _query = "INSERT INTO ?? (??) VALUES(?) ";
                _this._table.connection.query(_query, function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    var primaryKeyJsObjectProperty = Helper_1.default.toObjectProperty(_this._table.primaryKey);
                    obj[primaryKeyJsObjectProperty] = result.insertId;
                    primaryKeyValue = result.insertId;
                    _this._table.connection.notice(_this._table.name, _query, obj);
                    resolve(obj);
                    if (callback) {
                        callback(obj);
                    }
                }, [_this._table.name, objectColumns, objectValues]);
            }
        });
    };
    return SaveQuery;
})();
exports.default = SaveQuery;
