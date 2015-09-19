import Table from "./Table";
import Helper from "./Helper";
import ObservableObject from"./ObservableObject";

export enum CollectionChangedAction {
	INSERT, DELETE, RESET//for now I will use only add, remove and reset . replace and move is for future., REPLACE, MOVE
}

export class CollectionChangedEventArgs<T> {
	action: CollectionChangedAction;
	oldItems: (T | (T & ObservableObject))[];
	newItems: (T | (T & ObservableObject))[];
	oldStartingIndex: number;
	newStartingIndex: number;

	constructor(action: CollectionChangedAction, oldItems: (T | (T & ObservableObject))[] = [], newItems: (T | (T & ObservableObject))[] = [], oldStartingIndex: number = -1, newStartingIndex: number = -1) {
		this.action = action;
		this.oldItems = oldItems;
		this.newItems = newItems;
		this.oldStartingIndex = oldStartingIndex;
		this.newStartingIndex = newStartingIndex;
	}
}

class BaseCollection<T> {//T=result type of Table. BASE MEANS NO AUTO-INSERTS-UPDATES MADE. addItem doesnt add items to database, only to this collection.
 
	private list: (T | (T & ObservableObject))[] = [];
	public listeners: ((eventArgs: CollectionChangedEventArgs<T>) => void)[] = [];

	constructor(protected table: Table<T>) { }

	get length(): number {
		return this.list.length;
	}

	get isObservable(): boolean {
		return this.listeners.length > 0;
	}

	get items(): (T | (T & ObservableObject))[] {
		return this.list;
	}

	indexOf(item: T | string | number): number {
		for (let i = 0; i < this.list.length; i++) {
			let _itemIn = this.list[i];
			let _primaryKey = Helper.toObjectProperty(this.table.primaryKey);

			if (Helper.isString(item) || Helper.isNumber(item)) { //this is an ID, not an object. ( this happens on DeleteQuery).
				if (item === _itemIn[_primaryKey]) {
					return i;
				}
			} else {
				let _primarykeyVal: string | number;
				if (item[ObservableObject.RESERVED_PROPERTY_NAMES[0]] !== undefined) { //means it is already ObservableObject
					_primarykeyVal = item["_" + _primaryKey] //adds the_ 
				} else {
					_primarykeyVal = item[_primaryKey];
				}
				if (_primarykeyVal === _itemIn[_primaryKey]) {
					return i;
				}
			}
		}

		return -1;
	}

	findItem(itemId: string | number): (T | (T & ObservableObject)) {
		for (let i = 0; i < this.list.length; i++) {

			let _itemIn = this.list[i];
			if (!_itemIn) {
				continue;
			}

			let _primaryKey = Helper.toObjectProperty(this.table.primaryKey);

			if (itemId === _itemIn[_primaryKey]) {
				return _itemIn;
			}

		}
		return undefined;
	}


	getItem(index: number): T {
		return this.list[index];
	}

	getItemObservable(index: number): T & ObservableObject {
		let item = this.getItem(index);
		if (item[ObservableObject.RESERVED_PROPERTY_NAMES[0]] !== undefined) { //means it is already ObservableObject
			return <T & ObservableObject>item;
		} else {
			return <T & ObservableObject>new ObservableObject(item);
		}
	}

	//for pure item
	addItem(...items: (T | (T & ObservableObject))[]): (T | (T & ObservableObject)) {

		let startingIndex = this.list.length === 0 ? 1 : this.list.length;
		let evtArgs: CollectionChangedEventArgs<T> = new CollectionChangedEventArgs<T>(CollectionChangedAction.INSERT);
		evtArgs.newStartingIndex = startingIndex;
		let newItemPushed;
		items.forEach(item=> {
			this.list.push(item);

		});

		evtArgs.newItems = this.list; //here it just the whole new list no the new items just added
		
		this.notifyCollectionChanged(evtArgs);
		return newItemPushed;
	}
	
	//for pure item
	removeItem(...items: (T | (T & ObservableObject))[]): BaseCollection<T> {
		let startingIndex = this.indexOf(items[0]);
		if (startingIndex >= 0) {
			//actualy have something to be removed
		
			let evtArgs: CollectionChangedEventArgs<T> = new CollectionChangedEventArgs<T>(CollectionChangedAction.DELETE);
			evtArgs.oldStartingIndex = startingIndex;
			items.forEach(item => {
				let _index = this.indexOf(item);
				let itemWhichDeleted = this.list[_index];

				evtArgs.oldItems.push(itemWhichDeleted);
				this.list.splice(_index, 1);
				evtArgs.newItems = this.list;
			});


			this.notifyCollectionChanged(evtArgs);
		}
		return this;
	}

	removeItemById(id: number | string): BaseCollection<T> {

		let _indexToRemove = -1;

		let _primaryKey = Helper.toObjectProperty(this.table.primaryKey);
		this.list.some((item, index) => {
			if (item["_" + _primaryKey] === id || item[_primaryKey] === id) {//adds the_  anagastika... den kseroume an ola ta antikimena einai observable
				_indexToRemove = index;
				return true;

			} else {
				return false;
			}

		});
		//	console.log('index to remove: ' + _indexToRemove + 'from ' + this.list.length + ' items.');

		if (_indexToRemove >= 0) {

			let evtArgs: CollectionChangedEventArgs<T> = new CollectionChangedEventArgs<T>(CollectionChangedAction.DELETE);
			evtArgs.oldStartingIndex = _indexToRemove;
			evtArgs.oldItems = [this.list[_indexToRemove]];

			this.list.splice(_indexToRemove, 1);
			evtArgs.newItems = this.list;
			this.notifyCollectionChanged(evtArgs);
		}

		return this;

	}

	forgetItem(...items: (T | (T & ObservableObject))[]): BaseCollection<T> {
		if (items === undefined || items.length === 0) {
			this.listeners = [];
			this.list = [];
		} else {
			items.forEach(item => {
				this.list.splice(this.indexOf(item), 1);
			});
		}

		return this;
	}

	reset(): BaseCollection<T> {
		let startingIndex = this.list.length - 1;
		let evtArgs: CollectionChangedEventArgs<T> = new CollectionChangedEventArgs<T>(CollectionChangedAction.RESET);

		evtArgs.oldStartingIndex = startingIndex;
		evtArgs.oldItems = this.list.slice(0); // copy without reference.

		this.list = []; //reset the actual list
		evtArgs.newItems = this.list;
		this.notifyCollectionChanged(evtArgs);

		return this;
	}

	notifyCollectionChanged(evtArgs: CollectionChangedEventArgs<T>): void {
		this.listeners.forEach(listener=> {
			listener(evtArgs);
		});
	}

	onCollectionChanged(callback: (eventArgs: CollectionChangedEventArgs<T>) => void): void {
		this.listeners.push(callback);
	}

}

export default BaseCollection;