var Helper_1 = require("./Helper");
var ObservableObject_1 = require("./ObservableObject");
(function (CollectionChangedAction) {
    CollectionChangedAction[CollectionChangedAction["ADD"] = 0] = "ADD";
    CollectionChangedAction[CollectionChangedAction["REMOVE"] = 1] = "REMOVE";
    CollectionChangedAction[CollectionChangedAction["RESET"] = 2] = "RESET";
})(exports.CollectionChangedAction || (exports.CollectionChangedAction = {}));
var CollectionChangedAction = exports.CollectionChangedAction;
var CollectionChangedEventArgs = (function () {
    function CollectionChangedEventArgs(action, oldItems, newItems, oldStartingIndex, newStartingIndex) {
        if (oldItems === void 0) { oldItems = []; }
        if (newItems === void 0) { newItems = []; }
        if (oldStartingIndex === void 0) { oldStartingIndex = -1; }
        if (newStartingIndex === void 0) { newStartingIndex = -1; }
        this.action = action;
        this.oldItems = oldItems;
        this.newItems = newItems;
        this.oldStartingIndex = oldStartingIndex;
        this.newStartingIndex = newStartingIndex;
    }
    return CollectionChangedEventArgs;
})();
exports.CollectionChangedEventArgs = CollectionChangedEventArgs;
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
            var _itemIn = this.list[i];
            var _primaryKey = Helper_1.default.toObjectProperty(this.table.primaryKey);
            if (Helper_1.default.isString(item) || Helper_1.default.isNumber(item)) {
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
    };
    ObservableCollection.prototype.findItem = function (itemId) {
        for (var i = 0; i < this.list.length; i++) {
            var _itemIn = this.list[i];
            var _primaryKey = Helper_1.default.toObjectProperty(this.table.primaryKey);
            if (itemId === _itemIn[_primaryKey]) {
                return _itemIn;
            }
        }
        return undefined;
    };
    ObservableCollection.prototype.getItem = function (index) {
        return this.list[index];
    };
    ObservableCollection.prototype.getItemObservable = function (index) {
        var item = this.getItem(index);
        if (item[ObservableObject_1.default.RESERVED_PROPERTY_NAMES[0]] !== undefined) {
            return item;
        }
        else {
            return new ObservableObject_1.default(item);
        }
    };
    ObservableCollection.prototype.addItem = function () {
        var _this = this;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        var startingIndex = this.list.length === 0 ? 1 : this.list.length;
        var evtArgs = new CollectionChangedEventArgs(CollectionChangedAction.ADD);
        evtArgs.newStartingIndex = startingIndex;
        var newItemPushed;
        items.forEach(function (item) {
            _this.list.push(item);
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
        if (startingIndex >= 0) {
            var evtArgs = new CollectionChangedEventArgs(CollectionChangedAction.REMOVE);
            evtArgs.oldStartingIndex = startingIndex;
            items.forEach(function (item) {
                var _index = _this.indexOf(item);
                var itemWhichDeleted = _this.list[_index];
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
        var evtArgs = new CollectionChangedEventArgs(CollectionChangedAction.RESET);
        evtArgs.oldStartingIndex = startingIndex;
        evtArgs.oldItems = this.list.slice(0);
        this.list = [];
        this.notifyCollectionChanged(evtArgs);
        return this;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableCollection;
