import Helper from "./Helper";
import Table from "./Table";
import {default as BaseCollection, CollectionChangedEventArgs} from "./BaseCollection";
import {RawRules} from "./queries/SelectQueryRules";
import {DeleteAnswer} from "./queries/DeleteQuery";
import ObservableObject from "./ObservableObject";
import * as Promise from "bluebird";

class ObservableCollection<T> { //auti i klasi 9a xrisimopoieite ws Collection me kapoies paralages mesa sto index.ts.
    local: BaseCollection<T>;
    private _items: (T & ObservableObject)[];

    constructor(protected table: Table<T>, fetchAllFromDatabase?: boolean, callbackWhenReady?: Function) {
        this.local = new BaseCollection(table);

        if (fetchAllFromDatabase) {
            this.table.findAll().then((resultObjects) => {
                resultObjects.forEach(obj=> {
                    let observableObj = new ObservableObject(obj);
                    this.local.items.push(<T & ObservableObject>observableObj);
                });

                this.startListeningToDatabase();
                if (callbackWhenReady) {
                    callbackWhenReady();
                }

            });
        } else {
            this.startListeningToDatabase();
            if (callbackWhenReady) {
                callbackWhenReady();
            }
        }

    }

    get items(): (T & ObservableObject)[] {
        return <(T & ObservableObject)[]>this.local.items;
    }

    onCollectionChanged(callback: (eventArgs: CollectionChangedEventArgs<T>) => void): void {
        this.local.onCollectionChanged(callback);
    }

    startListeningToDatabase(): void {
		
        // listens to table's direct database events.
        this.table.on("INSERT", (rows: any[]) => {
            rows.forEach(row=> {
                let _newPureItem = this.table.objectFromRow(row);
                let _newObservableItem = new ObservableObject(_newPureItem);
                this.local.addItem(<T & ObservableObject>_newObservableItem);
            });
        });
        //edw prepei na perimenw gia to clear query kia meta na valw kai ta alla 
        this.table.on("UPDATE", (rows: any[]) => {
            //	console.log("UPDATE FROM DATABASE. BY OBSERVABLE COLLECTION");
            //rows = [{before: {rows} , after : {rows}}]
            rows.forEach(row => {
                let rowUpdated = row["after"];
                let existingItem = this.local.findItem(rowUpdated[this.table.primaryKey]); //rowUpdated is raw row, so this will work without toObjectProperty.
                if (existingItem !== undefined) {
                    let objRow = this.table.objectFromRow(rowUpdated);
                    Helper.forEachKey(objRow, key=> { //find only changed properties and change them.					
                        if (objRow[key] !== existingItem[key]) {
                            existingItem[key] = objRow[key]; //if it is observable will emit the propertyChanged event automatcly from ObservableObect.
                        }

                    });
                }

            });
        });

        this.table.on("DELETE", (rows: any[]) => {
            rows.forEach(row=> {
                this.local.removeItemById(row[this.table.primaryKey]);// row is raw row.
            });

        });
    }


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
    
	/**
	 * .insert() and .update() do the same thing:  .save();
	 */
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
	
	/**
	 * same thing as .remove();
	 */
    delete(criteriaOrID: any | number | string, callback?: (_result: DeleteAnswer) => any): Promise<DeleteAnswer> {
        return this.remove(criteriaOrID, callback);
    }


}

export default ObservableCollection;