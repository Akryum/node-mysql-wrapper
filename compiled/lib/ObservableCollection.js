var Helper_1 = require("./Helper");
(function (CollectionChangedAction) {
    CollectionChangedAction[CollectionChangedAction["ADD"] = 0] = "ADD";
    CollectionChangedAction[CollectionChangedAction["REMOVE"] = 1] = "REMOVE";
    CollectionChangedAction[CollectionChangedAction["RESET"] = 2] = "RESET";
})(exports.CollectionChangedAction || (exports.CollectionChangedAction = {}));
var CollectionChangedAction = exports.CollectionChangedAction;
var CollectionChangedEventArgs = (function () {
    function CollectionChangedEventArgs(action, oldItems, newItems, oldStartingIndex, newStartingIndex) {
        this.oldItems = [];
        this.newItems = [];
        this.oldStartingIndex = -1;
        this.newStartingIndex = -1;
        this.action = action;
        this.oldItems = oldItems;
        this.newItems = newItems;
        this.oldStartingIndex = oldStartingIndex;
        this.newStartingIndex = newStartingIndex;
    }
    return CollectionChangedEventArgs;
})();
exports.CollectionChangedEventArgs = CollectionChangedEventArgs;
var PropertyChangedEventArgs = (function () {
    function PropertyChangedEventArgs(propertyName, oldValue) {
        this.propertyName = propertyName;
        this.oldValue = oldValue;
    }
    return PropertyChangedEventArgs;
})();
exports.PropertyChangedEventArgs = PropertyChangedEventArgs;
var ObservableItem = (function () {
    function ObservableItem(item) {
        this.item = item;
        this.listeners = [];
    }
    Object.defineProperty(ObservableItem.prototype, "isObservable", {
        get: function () {
            return this.listeners.length > 0;
        },
        enumerable: true,
        configurable: true
    });
    ObservableItem.prototype.forget = function () {
        this.listeners = [];
    };
    ObservableItem.prototype.notifyPropertyChanged = function (propertyName, oldvalue) {
        var evtArgs = new PropertyChangedEventArgs(propertyName, oldvalue);
        this.listeners.forEach(function (listener) {
            listener(evtArgs);
        });
    };
    ObservableItem.prototype.onPropertyChanged = function (callback) {
        this.listeners.push(callback);
    };
    return ObservableItem;
})();
exports.ObservableItem = ObservableItem;
var ObservableCollection = (function () {
    function ObservableCollection(table) {
        this.table = table;
        this.list = [];
        this.listeners = [];
    }
    Object.defineProperty(ObservableCollection.prototype, "length", {
        get: function () {
            return this.list.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ObservableCollection.prototype, "isObservable", {
        get: function () {
            return this.listeners.length > 0;
        },
        enumerable: true,
        configurable: true
    });
    ObservableCollection.prototype.indexOf = function (item) {
        for (var i = 0; i < this.list.length; i++) {
            var _itemIn = this.list[i].item;
            var _primaryKey = Helper_1.default.toObjectProperty(this.table.primaryKey);
            if (item[_primaryKey] === _itemIn[_primaryKey]) {
                return i;
            }
        }
        return -1;
    };
    ObservableCollection.prototype.findItem = function (itemId) {
        for (var i = 0; i < this.list.length; i++) {
            var _itemIn = this.list[i];
            var _primaryKey = Helper_1.default.toObjectProperty(this.table.primaryKey);
            if (itemId === _itemIn.item[_primaryKey]) {
                return _itemIn;
            }
        }
        return undefined;
    };
    ObservableCollection.prototype.getItem = function (index) {
        return this.list[index];
    };
    ObservableCollection.prototype.addItem = function () {
        var _this = this;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        var startingIndex = this.list.length === 0 ? 1 : this.list.length;
        var evtArgs = new CollectionChangedEventArgs();
        evtArgs.action = CollectionChangedAction.ADD;
        evtArgs.newStartingIndex = startingIndex;
        var newItemPushed;
        items.forEach(function (item) {
            newItemPushed = new ObservableItem(Helper_1.default.copyObject(item));
            _this.list.push(newItemPushed);
        });
        evtArgs.newItems = this.list;
        this.notifyCollectionChanged(evtArgs);
        return newItemPushed;
    };
    ObservableCollection.prototype.removeItem = function () {
        var _this = this;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        var startingIndex = this.indexOf(items[0]);
        if (startingIndex > 0) {
            var evtArgs = new CollectionChangedEventArgs();
            evtArgs.action = CollectionChangedAction.REMOVE;
            evtArgs.oldStartingIndex = startingIndex;
            items.forEach(function (item) {
                var _index = _this.indexOf(item);
                var itemWhichDeleted = _this.list[_index];
                itemWhichDeleted.forget();
                evtArgs.oldItems.push(itemWhichDeleted);
                _this.list.splice(_index, 1);
            });
            this.notifyCollectionChanged(evtArgs);
        }
        return this;
    };
    ObservableCollection.prototype.forgetItem = function () {
        var _this = this;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        if (items === undefined || items.length === 0) {
            this.listeners = [];
            this.list = [];
        }
        else {
            items.forEach(function (item) {
                _this.list.splice(_this.indexOf(item), 1);
            });
        }
        return this;
    };
    ObservableCollection.prototype.reset = function () {
        var startingIndex = this.list.length - 1;
        var evtArgs = new CollectionChangedEventArgs();
        evtArgs.action = CollectionChangedAction.RESET;
        evtArgs.oldStartingIndex = startingIndex;
        evtArgs.oldItems = this.list.slice(0);
        this.list = [];
        this.notifyCollectionChanged(evtArgs);
        return this;
    };
    ObservableCollection.prototype.getChangedPropertiesOf = function (newObj) {
        var arr = [];
        var oldObj = this.findItem(newObj[Helper_1.default.toObjectProperty(this.table.primaryKey)]);
        if (oldObj !== undefined) {
            Helper_1.default.forEachKey(newObj, function (key) {
                if (oldObj.item[key] !== newObj[key]) {
                    arr.push(key);
                }
            });
        }
        return arr;
    };
    ObservableCollection.prototype.notifyCollectionChanged = function (evtArgs) {
        this.listeners.forEach(function (listener) {
            listener(evtArgs);
        });
    };
    ObservableCollection.prototype.onCollectionChanged = function (callback) {
        this.listeners.push(callback);
    };
    return ObservableCollection;
})();
exports.default = ObservableCollection;
