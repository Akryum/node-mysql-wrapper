import Helper from "../Helper";
import Table from "../Table"; //den to kanw apto MeteorTable.
import {TABLE_RULES_PROPERTY} from "../queries/SelectQueryRules";
import * as Promise from "bluebird";

declare module Meteor {
    var isServer: boolean;
    var isClient: boolean;

    var bindEnvironment: Function;
}

declare var Future;
/* In client side we just use: Users = new Mongo.Collection<T>('nameOfCollection')
In server side we use:  Users = db.meteorCollection<T>('usersOrTable','nameOfCollection',criteria?); . here we can use Users.find,findOne,insert,update,remove, and custom fillAll,fill,fillOne.*/
class MeteorMysqlCollection<T> {

    private collection: Mongo.Collection<T>;
    /**
     * Last/current raw criteria used to fill this collection. 
     * fill, and fillOne.
     */
    private criteriaRawJsObject: any;
    constructor(protected table?: Table<T>, public name?: string) {
        if (!name) {
            name = table.name;
        }
        if (Meteor) {
            Future = require("fibers/future");
        }

        this.collection = new Mongo.Collection<T>(name, { connection: null }); //no save to mongodb of course...
        this.startListeningToDatabase();
    }

    startListeningToDatabase(): void {
		
        // listens to table's direct database events.
        this.table.on("INSERT", Meteor.bindEnvironment((rows: any[]) => {
            rows.forEach(row=> {
                let _newPureItem = this.proccessJoinedTableInsert(this.table.objectFromRow(row)); //edw pernei to object, me ta joins ktlp
                this.collection.insert(_newPureItem);
            });
        }));

        this.table.on("UPDATE", Meteor.bindEnvironment((rows: any[]) => {

            rows.forEach(row => {
                let rowUpdated = row["after"];
                let criteriaExistingItem = {};
                criteriaExistingItem[Helper.toObjectProperty(this.table.primaryKey)] = rowUpdated[this.table.primaryKey];

                let objRow = this.table.objectFromRow(rowUpdated);

                this.collection.update(criteriaExistingItem, objRow);
            });
        }));

        this.table.on("DELETE", Meteor.bindEnvironment((rows: any[]) => {
            rows.forEach(row=> {
                let toBeRemovedCriteria = {};
                toBeRemovedCriteria[Helper.toObjectProperty(this.table.primaryKey)] = row[this.table.primaryKey];
                this.collection.remove(toBeRemovedCriteria);
            });

        }));
    }


    private proccessJoinedTableInsert(objRow: any): any {
        let future = new Future;
        let newCriteriaForOneObject: any = {};
        
        //  var BreakException = {};
        if (this.criteriaRawJsObject !== undefined) {
            // try {
            //vazoume  to Id gia na vrei ta joined se auto to single object.
            let primaryKeyOfObjValue = objRow[Helper.toObjectProperty(this.table.primaryKey)];
            newCriteriaForOneObject[Helper.toObjectProperty(this.table.primaryKey)] = primaryKeyOfObjValue;

            Helper.forEachKey(this.criteriaRawJsObject, key=> {
                if (objRow[key] === undefined) { //an sto  object row pou ir9e apto db event den uparxei auto to property  
                    let joinedTable = this.criteriaRawJsObject[key];
                    if (Helper.hasRules(joinedTable) && joinedTable[TABLE_RULES_PROPERTY]["table"] !== undefined) { //kai auto to key exei table rules, ara einai property joined table.
                        //AT LEAST ONE JOINED TABLE, THEN WE WILL MAKE A FIND FROM TABLE TO FETCH ALL POSSIBLE JOINED TABLES, MAKE OBJROW = TO THE RESULT.
                        
                        newCriteriaForOneObject[key] = joinedTable; //Eg: author = { userId: '=authorId',
                        // tableRules: { table: 'users', limit: 1, limitStart: 1, limitEnd: 1 } }
                                                                    


                    }
                }

            });

            this.table.findSingle(newCriteriaForOneObject).then((_result) => {
                future.return(_result);
            });
            /*  } catch (e) {
                  if (e !== BreakException) { throw e;} //an dn einai error gia break to loop tote emfanise to aliws upo9etoume oti vrike estw ena joined table.
                  
                  let primaryKeyOfObj = objRow[Helper.toRowProperty(this.table.primaryKey)];
                  
              }*/

        } else {
            future.return(objRow);

        }


        return future.wait();
    }

    rawCollection(): any {/** TODO: add return value **/
        return this.collection.rawCollection();
    }
    rawDatabase(): any {/** TODO: add return value **/
        return this.collection.rawDatabase();
    }

    _ensureIndex(indexName: string, options?: { [key: string]: any }): void {
        return this.collection._ensureIndex(indexName, options);
    }

    allow(options: {
        insert?: (userId: string, doc: T) => boolean;
        update?: (userId: string, doc: T, fieldNames: string[], modifier: any) => boolean;
        remove?: (userId: string, doc: T) => boolean;
        fetch?: string[];
        transform?: Function;
    }): boolean {
        return this.collection.allow(options);
    }

    deny(options: {
        insert?: (userId: string, doc: T) => boolean;
        update?: (userId: string, doc: T, fieldNames: string[], modifier: any) => boolean;
        remove?: (userId: string, doc: T) => boolean;
        fetch?: string[];
        transform?: Function;
    }): boolean {
        return this.collection.deny(options);
    }


    fill(criteriaRawJsObject: any = {}): MeteorMysqlCollection<T> {
        let future = new Future;
        this.criteriaRawJsObject = criteriaRawJsObject;
        this.table.find(criteriaRawJsObject).then(Meteor.bindEnvironment((results: T[]) => {
            results.forEach(result=> {
                this.collection.insert(result);
            });

            future.return(this);
        }));


        return future.wait();
    }

    fillAll(): MeteorMysqlCollection<T> {
        let future = new Future;

        this.table.findAll().then(Meteor.bindEnvironment((results: T[]) => {
            results.forEach(result=> {
                this.collection.insert(result);
            });

            future.return(this);
        }));

        return future.wait();
    }

    fillOne(criteriaRawJsObject: any): MeteorMysqlCollection<T> {
        let future = new Future;
        this.criteriaRawJsObject = criteriaRawJsObject;
        this.table.findSingle(criteriaRawJsObject).then(Meteor.bindEnvironment((result: T) => {
            this.collection.insert(result);
            future.return(this);
        }));


        return future.wait();
    }

    find(selector?: any, options?: {
        sort?: any;
        skip?: number;
        limit?: number;
        fields?: any;
        reactive?: boolean;
        transform?: Function;
    }): Mongo.Cursor<T> {
        return this.collection.find(selector ? selector : {}, options ? options : {});
    }


    findOne(selector?: any, options?: {
        sort?: any;
        skip?: number;
        fields?: any;
        reactive?: boolean;
        transform?: Function;
    }): T {
        return this.collection.findOne(selector ? selector : {}, options ? options : {});
    }

    insert(doc: T, callback?: Function): string {
        let future = new Future;

        this.table.save(doc).then(Meteor.bindEnvironment((res) => {
            let _primarykey = res[Helper.toObjectProperty(this.table.primaryKey)];
            if (callback !== undefined) {
                callback(_primarykey);
            }
            future.return(_primarykey); //return the new id
               
        }));

        return future.wait();
    }

    remove(selector: any, callback?: Function): void {
        let future = new Future;

        this.table.remove(selector).then(Meteor.bindEnvironment((res) => {
            if (callback !== undefined) {
                callback(res);
            }
            future.return(res);
        }));


        return future.wait();
    }

    update(selector: any, modifier?: any, options?: {
        multi?: boolean;
        upsert?: boolean;
    }, callback?: Function): number { //1 for success -1 for fail
        let future = new Future;

        this.table.save(selector).then(Meteor.bindEnvironment((res) => {
            if (callback !== undefined) {
                callback(1);
            }
            future.return(1);
        }, (err: any) => {
            if (callback !== undefined) {
                callback(-1);
            }
            future.return(-1);
        }));

        return future.wait();
    }
}

export default MeteorMysqlCollection;