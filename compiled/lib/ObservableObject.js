import Helper from "./Helper";
import { TABLE_RULES_PROPERTY } from "./queries/SelectQueryRules";
export class PropertyChangedArgs {
    constructor(propertyName, oldValue) {
        this.propertyName = propertyName;
        this.oldValue = oldValue;
    }
}
class ObservableObject {
    constructor(obj) {
        if (obj) {
            this.makeObservable(obj);
        }
    }
    makeObservable(obj) {
        for (var key in obj) {
            this["_" + key] = obj[key];
        }
        Helper.forEachKey(this, key => {
            var propertyName = key["substr"](1);
            if (ObservableObject.RESERVED_PROPERTY_NAMES.indexOf(propertyName) === -1) {
                Object.defineProperty(ObservableObject.prototype, propertyName, {
                    get: () => {
                        return this[key];
                    },
                    set: (_value) => {
                        if (_value !== undefined && this[key] !== _value) {
                            let oldValue = this[key];
                            this[key] = _value;
                            this.notifyPropertyChanged(propertyName, oldValue);
                        }
                    },
                    enumerable: false,
                    configurable: true
                });
            }
        });
    }
    onPropertyChanged(listener) {
        if (!this.propertyChangedListeners)
            this.propertyChangedListeners = [];
        this.propertyChangedListeners.push(listener);
    }
    _forget() {
        this.propertyChangedListeners = [];
    }
    notifyPropertyChanged(propertyName, oldValue) {
        if (this.propertyChangedListeners && this.propertyChangedListeners.length > 0) {
            for (let i = 0; i < this.propertyChangedListeners.length; i++) {
                this.propertyChangedListeners[i](new PropertyChangedArgs(propertyName, oldValue));
            }
        }
    }
    toJSON(...excludeProperties) {
        let rawObject = {};
        Helper.forEachKey(this, _key => {
            if (ObservableObject.RESERVED_PROPERTY_NAMES.indexOf(_key) == -1) {
                let key = Helper.toObjectProperty(_key.substr(1));
                if (key !== TABLE_RULES_PROPERTY && excludeProperties.indexOf(key) == -1) {
                    rawObject[key] = this[key];
                }
            }
        });
        return rawObject;
    }
}
ObservableObject.RESERVED_PROPERTY_NAMES = ["propertyChangedListeners", "notifyPropertyChanged", "onPropertyChanged", "toJSON", "makeObservable", "_forget"];
export default ObservableObject;
