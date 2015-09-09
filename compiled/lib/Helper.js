var SelectQueryRules_1 = require("./queries/SelectQueryRules");
var Helper = (function () {
    function Helper() {
    }
    Helper.copyObject = function (object) {
        var objectCopy = {};
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                objectCopy[key] = object[key];
            }
        }
        return objectCopy;
    };
    Helper.toObjectProperty = function (columnKey) {
        return columnKey.replace(/(_.)/g, function (x) { return x[1].toUpperCase(); });
    };
    Helper.toRowProperty = function (objectKey) {
        return objectKey.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
    };
    Helper.forEachValue = function (map, callback) {
        var result;
        for (var id in map) {
            if ((result = callback(map[id])))
                break;
        }
        return result;
    };
    Helper.forEachKey = function (map, callback) {
        var result;
        for (var id in map) {
            if ((result = callback(id)))
                break;
        }
        return result;
    };
    Helper.isFunction = function (functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    };
    Helper.hasRules = function (obj) {
        return obj !== undefined && obj[SelectQueryRules_1.TABLE_RULES_PROPERTY] !== undefined;
    };
    return Helper;
})();
exports.default = Helper;
