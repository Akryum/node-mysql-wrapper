import Helper from "./Helper";

export class PropertyChangedArgs {
	constructor(public propertyName: string, public oldValue: any) {

	}
}

export type PropertyChangedCallback = (args: PropertyChangedArgs) => any;

class ObservableObject {

	static RESERVED_PROPERTY_NAMES: string[] = ["propertyChangedListeners", "notifyPropertyChanged","onPropertyChanged", "toJSON","makeObservable"];

	private propertyChangedListeners: PropertyChangedCallback[];

	constructor(obj?: any) {
		if (obj) {
			this.makeObservable(obj);
		}
	}

	private makeObservable(obj: any): void {
		for (var key in obj) {
            this["_" + key] = obj[key];
        }

		Helper.forEachKey(this, key => {
            var propertyName: string = key["substr"](1);
			if (ObservableObject.RESERVED_PROPERTY_NAMES.indexOf(propertyName) === -1) {
				Object.defineProperty(ObservableObject.prototype, propertyName, {
					get: () => {
						return this[key];
					},
					set: (_value) => {

						if (_value !== undefined && this[key] !== _value) {
							//notify here
							let oldValue = this[key];
							this[key] = _value;
							this.notifyPropertyChanged(propertyName, oldValue);
							//cb(propertyName, _value, obj[key]);
						}
					},
					enumerable: false,
					configurable: true

				});
			}
        });
	}

	onPropertyChanged(listener: PropertyChangedCallback): void {
		if (!this.propertyChangedListeners) this.propertyChangedListeners = [];

		this.propertyChangedListeners.push(listener);
	}

	private notifyPropertyChanged(propertyName: string, oldValue: any): void {
		if (this.propertyChangedListeners && this.propertyChangedListeners.length > 0) {
			for (let i = 0; i < this.propertyChangedListeners.length; i++) {
				this.propertyChangedListeners[i](new PropertyChangedArgs(propertyName, oldValue));
			}
		}
	}

	toJSON(...excludeProperties: string[]) {
		let rawObject = {};

		Helper.forEachKey(this, _key=> {
			//epidi ta exw _ ta real properties tou table:
			if (ObservableObject.RESERVED_PROPERTY_NAMES.indexOf(_key) == -1) {
		
				let key = Helper.toObjectProperty( _key.substr(1));	// vgazoume to _ gia na mi ginei UserId anti gia userId px.
				if (key !== "tableRules" && excludeProperties.indexOf(key) == -1) {
					rawObject[key] = this[key];
				}
			}

		});

		return rawObject;
	}

}

export default ObservableObject;