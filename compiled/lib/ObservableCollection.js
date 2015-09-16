import Helper from "./Helper";
export var CollectionChangedAction;
(function (CollectionChangedAction) {
    CollectionChangedAction[CollectionChangedAction["ADD"] = 0] = "ADD";
    CollectionChangedAction[CollectionChangedAction["REMOVE"] = 1] = "REMOVE";
    CollectionChangedAction[CollectionChangedAction["RESET"] = 2] = "RESET";
})(CollectionChangedAction || (CollectionChangedAction = {}));
export class CollectionChangedEventArgs {
    constructor(action, oldItems = [], newItems = [], oldStartingIndex = -1, newStartingIndex = -1) {
        this.action = action;
        this.oldItems = oldItems;
        this.newItems = newItems;
        this.oldStartingIndex = oldStartingIndex;
        this.newStartingIndex = newStartingIndex;
    }
}
class ObservableCollection {
    constructor(table) {
        this.table = table;
        this.list = [];
        this.listeners = [];
    }
    get length() {
        return this.list.length;
    }
    get isObservable() {
        return this.listeners.length > 0;
    }
    indexOf(item) {
        for (let i = 0; i < this.list.length; i++) {
            let _itemIn = this.list[i];
            let _primaryKey = Helper.toObjectProperty(this.table.primaryKey);
            if (Helper.isString(item) || Helper.isNumber(item)) {
                if (item === _itemIn[_primaryKey]) {
                    return i;
                }
            }
            else {
                if (item[_primaryKey] === _itemIn[_primaryKey]) {
                    return i;
                }
            }
        }
        return -1;
    }
    findItem(itemId) {
        for (let i = 0; i < this.list.length; i++) {
            let _itemIn = this.list[i];
            let _primaryKey = Helper.toObjectProperty(this.table.primaryKey);
            if (itemId === _itemIn[_primaryKey]) {
                return _itemIn;
            }
        }
        return undefined;
    }
    getItem(index) {
        return this.list[index];
    }
    addItem(...items) {
        let startingIndex = this.list.length === 0 ? 1 : this.list.length;
        let evtArgs = new CollectionChangedEventArgs(CollectionChangedAction.ADD);
        evtArgs.newStartingIndex = startingIndex;
        let newItemPushed;
        items.forEach(item => {
            this.list.push(item);
        });
        evtArgs.newItems = this.list;
        this.notifyCollectionChanged(evtArgs);
        return newItemPushed;
    }
    removeItem(...items) {
        let startingIndex = this.indexOf(items[0]);
        if (startingIndex >= 0) {
            let evtArgs = new CollectionChangedEventArgs(CollectionChangedAction.REMOVE);
            evtArgs.oldStartingIndex = startingIndex;
            items.forEach(item => {
                let _index = this.indexOf(item);
                let itemWhichDeleted = this.list[_index];
                evtArgs.oldItems.push(itemWhichDeleted);
                this.list.splice(_index, 1);
            });
            this.notifyCollectionChanged(evtArgs);
        }
        return this;
    }
    forgetItem(...items) {
        if (items === undefined || items.length === 0) {
            this.listeners = [];
            this.list = [];
        }
        else {
            items.forEach(item => {
                this.list.splice(this.indexOf(item), 1);
            });
        }
        return this;
    }
    reset() {
        let startingIndex = this.list.length - 1;
        let evtArgs = new CollectionChangedEventArgs(CollectionChangedAction.RESET);
        evtArgs.oldStartingIndex = startingIndex;
        evtArgs.oldItems = this.list.slice(0);
        this.list = [];
        this.notifyCollectionChanged(evtArgs);
        return this;
    }
    notifyCollectionChanged(evtArgs) {
        this.listeners.forEach(listener => {
            listener(evtArgs);
        });
    }
    onCollectionChanged(callback) {
        this.listeners.push(callback);
    }
}
export default ObservableCollection;
