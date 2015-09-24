import Connection from "../Connection";
import Table from "../Table";
import {DeleteAnswer} from "../queries/DeleteQuery";
import CriteriaBuilder from "../CriteriaBuilder";
import MeteorCollection from "./MeteorCollection";

import * as Promise from 'bluebird';

declare module Meteor {
    var isServer: boolean;
    var isClient: boolean;

    var bindEnvironment: Function;
}

declare var Future;

class MeteorTable<T> {//extends Table<T>{
    
    constructor(public table: Table<T>) {
        if (Meteor) {
            Future = require("fibers/future");
        }
    }

    get criteria(): CriteriaBuilder<T> {
        return this.table.criteria;
    }

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
    }

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
        return null;
    }

    update(selector: any, callback?: (result: T) => any): T {

        if (callback) { // then async
            this.table.save(selector, callback);
        } else { //then sync.
            let future = new Future;
            this.table.save(selector).then((_result: T) => {
                future.return(_result);
            });

            return future.wait();
        }
     
        
        //return this.collection.update(selector, modifier, options, callback);
    }

    collection(nameOfCollection?: string, fillWithCriteria: any = {}): Mongo.Collection<T> {
        let col = new MeteorCollection<T>(this.table, nameOfCollection); //edw pernei to Table, swsta
        col.fill(fillWithCriteria);
        return col.rawCollection;;
    }

}

export default MeteorTable;