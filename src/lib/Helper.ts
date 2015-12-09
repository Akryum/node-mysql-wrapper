import {TABLE_RULES_PROPERTY} from "./queries/SelectQueryRules";
import {EQUAL_TO_PROPERTY_SYMBOL} from "./queries/SelectQuery";
export interface Map<T> {
    [index: string]: T;
}

class Helper {
    constructor() { }

    private static escapeRegExp(string):string {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    public static replaceAll(string, find, replace):string {
        return string.replace(new RegExp(Helper.escapeRegExp(find), 'g'), replace);
    }

    static copyObject<T>(object: T): T {
        let objectCopy = <T>{};
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                objectCopy[key] = object[key];
            }
        }

        return objectCopy;
    }

    static toObjectProperty(columnKey: string): string {
        //convert column_key to objectKey
        //return columnKey.replace(/(_.)/g, (x) => { return x[1].toUpperCase() });
        return columnKey;
    }

    static toRowProperty(objectKey: string): string {
        //convert objectKey to column_key
        //return objectKey.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
        return objectKey;
    }

    static forEachValue<T, U>(map: Map<T>, callback: (value: T) => U): U {
        let result: U;
        for (let id in map) {
            if ((result = callback(map[id]))) break;
        }
        return result;
    }

    /* static forEachKey<T, U>(map: Map<T>, callback: (key: string) => U): U {
         let result: U;
         for (let id in map) {
             if ((result = callback(id))) break;
         }
         return result;
     }*/

    static forEachKey<T, U>(map: T, callback: (key: string) => U): U {
        let result: U;
        for (let id in map) {
            if ((result = callback(id))) break;
        }
        return result;
    }


    static isFunction(functionToCheck: any): boolean {
        let getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

    static isString(something: any): boolean {
        return typeof something === 'string' || something instanceof String;
    }

    static isNumber(something: any): boolean {
        return !isNaN(something - 0) && something !== null && something !== "" && something !== false;
    }

    static hasRules(obj: any): boolean {
        return obj !== undefined && obj[TABLE_RULES_PROPERTY] !== undefined;
    }

    /*
    ///TODO: kapoia stigmh
        static getTablesFrom(obj: any): TABLE_PROPERTY_INTERFACE[] {//[{tableName:string,propertyName:string}]{
            let tables: TABLE_PROPERTY_INTERFACE[] = [];
    
            if (Helper.hasRules(obj)) {
                Helper.forEachKey(obj, key=> {
                    let prop = obj[key];
                    let foreignKey;
                    let thisKey;
                    //an uparxei to thisKey 9a einai se morfi =thisKey
                    //an oxi tote einai se morfi = sketo.
                    
                    //to foreign key einai to perito property...den uparxei standar tropos gia na to vrw.
             ///TODO:     prop[TABLE_RULES_PROPERTY] ? or key?  if(key.indexOf(EQUAL_TO_PROPERTY_SYMBOL) && key.length)
                    let realTableName = prop[TABLE_RULES_PROPERTY]["table"];
                    if (realTableName !== undefined) {
                        tables.push({ tableName: Helper.toRowProperty(realTableName), propertyName: key, thisKey:thisKey,foreignKey:foreignKey });
                    }
                });
    
            }
            return tables;
        }
        */

    static extendTypes<T, U>(first: T, second: U): T & U {
        let result = <T & U>{};
        for (let id in first) {
            result[id] = first[id];
        }
        for (let id in second) {
            if (!result.hasOwnProperty(id)) {
                result[id] = second[id];
            }
        }
        return result;
    }


}

export default Helper;