import Helper from "./Helper";
import Table from "./Table";
import {RawRules} from "./queries/SelectQueryRules";
import {DeleteAnswer} from "./queries/DeleteQuery";
import ObservableObject from "./ObservableObject";
import Database from "./Database";
import * as Promise from "bluebird";
var Future = require("fibers/future"); //anagastika...

declare module Meteor {
    var isServer: boolean;
    var isClient: boolean;

    var bindEnvironment: Function;
}

class MeteorCollection<T> {
    private collection: Mongo.Collection<T>;
    //private table: Table<T>;

    constructor(public table: Table<T>, public name?: string) {
        if (!name) {
            name = table.name;
        }

        this.collection = new Mongo.Collection<T>(name, { connection: null }); //no save to mongodb of course...
        this.startListeningToDatabase();

    }

    startListeningToDatabase(): void {
		
        // listens to table's direct database events.
        this.table.on("INSERT", Meteor.bindEnvironment((rows: any[]) => {
            rows.forEach(row=> {
                let _newPureItem = this.table.objectFromRow(row);
                // let _newObservableItem = new ObservableObject(_newPureItem);
                //   this.local.addItem(<T & ObservableObject>_newObservableItem);
                this.collection.insert(_newPureItem);
            });
        }));
        //edw prepei na perimenw gia to clear query kia meta na valw kai ta alla 
        this.table.on("UPDATE", Meteor.bindEnvironment((rows: any[]) => {
            //	console.log("UPDATE FROM DATABASE. BY OBSERVABLE COLLECTION");
            //rows = [{before: {rows} , after : {rows}}]
            rows.forEach(row => {
                let rowUpdated = row["after"];
                //let existingItem = this.local.findItem(rowUpdated[this.table.primaryKey]); //rowUpdated is raw row, so this will work without toObjectProperty.
                let criteriaExistingItem = {};
                criteriaExistingItem[Helper.toObjectProperty(this.table.primaryKey)] = rowUpdated[this.table.primaryKey];
                // let existingItem = this.collection.findOne(criteriaExistingItem);
                //   if (existingItem !== undefined) {
                let objRow = this.table.objectFromRow(rowUpdated);
                /*   Helper.forEachKey(objRow, key=> { //find only changed properties and change them.					
                      if (objRow[key] !== existingItem[key]) {
                          existingItem[key] = objRow[key]; //if it is observable will emit the propertyChanged event automatcly from ObservableObect.
                      }

                  });*/
                 
                //   }
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

    get rawCollection(): Mongo.Collection<T> {
        return this.collection;
    }

    fill(criteriaRawJsObject: any): void {
        let future = new Future;

        this.table.find(criteriaRawJsObject).then(Meteor.bindEnvironment((results: T[]) => {
            results.forEach(result=> {
                this.collection.insert(result);
            });

            future.return();
        }));
        return future.wait();
    }

    fillAll(): void {
        let future = new Future;

        this.table.findAll().then(Meteor.bindEnvironment((results: T[]) => {
            results.forEach(result=> {
                this.collection.insert(result);
            });

            future.return();
        }));
        return future.wait();
    }

    fillOne(criteriaRawJsObject: any): void {
        let future = new Future;

        this.table.findSingle(criteriaRawJsObject).then(Meteor.bindEnvironment((result: T) => {
            this.collection.insert(result);
            future.return();
        }));
        return future.wait();
    }
    
    //ONLY MONGO/METEOR COLLECTION METHODS START
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

    find(selector?: any, options?: {
        sort?: any;
        skip?: number;
        limit?: number;
        fields?: any;
        reactive?: boolean;
        transform?: Function;
    }): Mongo.Cursor<T> {
        
        return this.collection.find(selector, options);
    };

    findOne(selector?: any, options?: {
        sort?: any;
        skip?: number;
        fields?: any;
        reactive?: boolean;
        transform?: Function;
    }): T {
        return this.collection.findOne(selector, options);
    };
    
    //ONLY MONGO/METEOR COLLECTION METHODS FINISH.

    insert(doc: T, callback?: (_result: T) => void): T {
        if (callback) { // then async
            this.table.save(doc, callback);
        } else { //then sync.
            let future = new Future;
            this.table.save(doc).then((_result: T) => {
                future.return(_result);
            });
            //  return this.collection.insert(doc, callback);
      
            return future.wait();
        }
    };

    remove(selector: any, callback?: () => DeleteAnswer): DeleteAnswer {
        if (callback) { // then async
            this.table.remove(selector, callback);
        } else { //then sync.
            let future = new Future;
            this.table.remove(selector).then((dAnswer) => {
                future.return(dAnswer);
            });

            return future.wait();
        }
        //   return this.collection.remove(selector, callback);
    };

    update(selector: any, modifier: any, options?: {
        multi?: boolean;
        upsert?: boolean;
    }, callback?: (result: T) => any): number {

        if (callback) { // then async
            this.table.save(modifier, callback);
        } else { //then sync.
            let future = new Future;
            this.table.save(modifier).then((_result: T) => {
                future.return(_result);
            });

            return future.wait();
        }
        
        //return this.collection.update(selector, modifier, options, callback);
    };
  

    /*   get items(): Mongo.Collection<T> {
           return this.collection;
       } //edw na epistrfw tin mongo collection gia ta local find ktlp
   
       find(criteriaRawJsObject?: any, callback?: (_results: T[]) => any): Promise<T[]> {
           return this.table.find(criteriaRawJsObject, callback);
       }
   
       findOne(criteriaRawJsObject: any, callback?: (_result: T) => any): Promise<T> {
           return this.table.findOne(criteriaRawJsObject, callback);
       }
   
       findById(id: number | string, callback?: (result: T) => any): Promise<T> {
           return this.table.findById(id, callback);
       }
   
       findAll(tableRules?: RawRules, callback?: (_results: T[]) => any): Promise<T[]> {
           return this.table.findAll(tableRules, callback);
       }
   
       insert(criteriaRawJsObject: any, callback?: (_result: any) => any): Promise<T | any> {
           return this.table.save(criteriaRawJsObject, callback);
       }
   
       update(criteriaRawJsObject: any, callback?: (_result: any) => any): Promise<T | any> {
           return this.table.save(criteriaRawJsObject, callback);
       }
   
       save(criteriaRawJsObject: any, callback?: (_result: any) => any): Promise<T | any> {
           return this.table.save(criteriaRawJsObject, callback);
       }
   
       remove(criteriaOrID: any | number | string, callback?: (_result: DeleteAnswer) => any): Promise<DeleteAnswer> {
           return this.table.remove(criteriaOrID, callback);
       }
   	
   
       delete(criteriaOrID: any | number | string, callback?: (_result: DeleteAnswer) => any): Promise<DeleteAnswer> {
           return this.remove(criteriaOrID, callback);
       }*/
}


export default MeteorCollection;