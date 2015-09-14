import Table from "./Table";
import Helper from "./Helper";

//export type onCollectionChangedCallback = <T>(eventArgs: CollectionChangedEventArgs<T>) => void;
export type onPropertyChangedCallback = (eventArgs: PropertyChangedEventArgs) => void;

export enum CollectionChangedAction {
	ADD, REMOVE, RESET//for now I will use only add, remove and reset . replace and move is for future., REPLACE, MOVE
}

export class CollectionChangedEventArgs<T> {
	action: CollectionChangedAction;
	oldItems: ObservableItem<T>[];
	newItems: ObservableItem<T>[];
	oldStartingIndex: number;
	newStartingIndex: number;

	constructor(action: CollectionChangedAction, oldItems: ObservableItem<T>[]=[], newItems: ObservableItem<T>[]=[], oldStartingIndex: number=-1, newStartingIndex: number=-1) {
		this.action = action;
		this.oldItems = oldItems;
		this.newItems = newItems;
		this.oldStartingIndex = oldStartingIndex;
		this.newStartingIndex = newStartingIndex;
	}
}

export class PropertyChangedEventArgs {
	constructor(public propertyName: string, public oldValue: any) {

	}
}

export class ObservableItem<T> {

	private listeners: onPropertyChangedCallback[] = [];

	constructor(public item: T) {

	}

	get isObservable(): boolean {
		return this.listeners.length > 0;
	}

	forget(): void {
		this.listeners = [];
	}

	notifyPropertyChanged(propertyName: string, oldvalue: any): void {
		let evtArgs: PropertyChangedEventArgs = new PropertyChangedEventArgs(propertyName, oldvalue);

		this.listeners.forEach(listener=> {
			listener(evtArgs);
		});
	}

	onPropertyChanged(callback: onPropertyChangedCallback): void {
		this.listeners.push(callback);
	}


}

class ObservableCollection<T> {//T=result type of Table
	private list: ObservableItem<T>[] = [];
	private listeners: ((eventArgs: CollectionChangedEventArgs<T>) => void)[] = [];

	constructor(protected table: Table<T>) { }

	get length(): number {
		return this.list.length;
	}

	get isObservable(): boolean {
		return this.listeners.length > 0;
	}
	
	//for pure item
	indexOf(item: T | string | number): number {
		for (let i = 0; i < this.list.length; i++) {
			let _itemIn = this.list[i].item;
			let _primaryKey = Helper.toObjectProperty(this.table.primaryKey);

			if (Helper.isString(item) || Helper.isNumber(item)) { //this is an ID, not an object. ( this happens on DeleteQuery).
				if (item === _itemIn[_primaryKey]) {
					return i;
				}
			} else {

				if (item[_primaryKey] === _itemIn[_primaryKey]) {
					return i;
				}
			}
		}
		return -1;
	}
	
	//for observable item
	findItem(itemId: string | number): ObservableItem<T> {
		for (let i = 0; i < this.list.length; i++) {
			let _itemIn = this.list[i];
			let _primaryKey = Helper.toObjectProperty(this.table.primaryKey);

			if (itemId === _itemIn.item[_primaryKey]) {
				return _itemIn;
			}

		}
		return undefined;
	}


	getItem(index: number): ObservableItem<T> {
		return this.list[index];
	}

	//for pure item
	addItem(...items: T[]): ObservableItem<T> {

		let startingIndex = this.list.length === 0 ? 1 : this.list.length;
		let evtArgs: CollectionChangedEventArgs<T> = new CollectionChangedEventArgs<T>(CollectionChangedAction.ADD);
		evtArgs.newStartingIndex = startingIndex;
		let newItemPushed;
		items.forEach(item=> {
			newItemPushed = new ObservableItem(Helper.copyObject(item)); //kanw copy gt aliws px me user.username dn 9a kanei trigger ti nea allagh 
			this.list.push(newItemPushed);

		});

		evtArgs.newItems = this.list; //here it just the whole new list no the new items just added
		
		this.notifyCollectionChanged(evtArgs);
		return newItemPushed;
	}
	
	//for pure item
	removeItem(...items: T[]): ObservableCollection<T> {
		let startingIndex = this.indexOf(items[0]);
		if (startingIndex >= 0) {
			//actualy have something to be removed
		
			let evtArgs: CollectionChangedEventArgs<T> = new CollectionChangedEventArgs<T>(CollectionChangedAction.REMOVE);
			evtArgs.oldStartingIndex = startingIndex;
			items.forEach(item => {
				let _index = this.indexOf(item);
				let itemWhichDeleted = this.list[_index];
				itemWhichDeleted.forget();
				evtArgs.oldItems.push(itemWhichDeleted);
				this.list.splice(_index, 1);
			});


			this.notifyCollectionChanged(evtArgs);
		}
		return this;
	}

	forgetItem(...items: T[]): ObservableCollection<T> {
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

	reset(): ObservableCollection<T> {
		let startingIndex = this.list.length - 1;
		let evtArgs: CollectionChangedEventArgs<T> = new CollectionChangedEventArgs<T>(CollectionChangedAction.RESET);

		evtArgs.oldStartingIndex = startingIndex;
		evtArgs.oldItems = this.list.slice(0); // copy without reference.
		this.list = []; //reset the actual list
		this.notifyCollectionChanged(evtArgs);

		return this;
	} 

	getChangedPropertiesOf(newObj: any): string[] {
		let arr: string[] = [];
		let oldObj = this.findItem(newObj[Helper.toObjectProperty(this.table.primaryKey)]);
		if (oldObj !== undefined) {
			Helper.forEachKey(newObj, (key) => {
				if (oldObj.item[key] !== newObj[key]) {
					arr.push(key);
				}
			});
		}


		return arr;
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

export default ObservableCollection;