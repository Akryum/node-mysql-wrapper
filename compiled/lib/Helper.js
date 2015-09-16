import { TABLE_RULES_PROPERTY } from "./queries/SelectQueryRules";
class Helper {
    constructor() {
    }
    static copyObject(object) {
        let objectCopy = {};
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                objectCopy[key] = object[key];
            }
        }
        return objectCopy;
    }
    static toObjectProperty(columnKey) {
        return columnKey.replace(/(_.)/g, (x) => { return x[1].toUpperCase(); });
    }
    static toRowProperty(objectKey) {
        return objectKey.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
    }
    static forEachValue(map, callback) {
        let result;
        for (let id in map) {
            if ((result = callback(map[id])))
                break;
        }
        return result;
    }
    static forEachKey(map, callback) {
        let result;
        for (let id in map) {
            if ((result = callback(id)))
                break;
        }
        return result;
    }
    static isFunction(functionToCheck) {
        let getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }
    static isString(something) {
        return typeof something === 'string' || something instanceof String;
    }
    static isNumber(something) {
        return !isNaN(something - 0) && something !== null && something !== "" && something !== false;
    }
    static hasRules(obj) {
        return obj !== undefined && obj[TABLE_RULES_PROPERTY] !== undefined;
    }
}
export default Helper;
