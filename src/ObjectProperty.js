import KeyedApi from "./KeyedApi";
import KeyedShadowImpl from "./KeyedShadowImpl";
import Property from "./Property";
import SimpleShadow from "./SimpleShadow";
import createPropertyClass from "./createPropertyClass";


/*
	A generic object property type that supports keyed child properties. The default implementation class is
	KeyedShadowImpl. The default shadow class is SimpleShadow.

	Transition note: Slowly migrating API away from accessing property related entities using
		Object.defineProperty() or get xyz() and using methods instead to reduce shadowing overhead.
*/
export default class ObjectProperty extends Property {
	constructor(initialState={}, autoShadow, readonly) {
		super(initialState, autoShadow, readonly);

		this._keyed = new KeyedApi(this);

		this.setImplementationClass(KeyedShadowImpl);
		this.setShadowClass(SimpleShadow);
	}

	/*
		Factory function for creating an ObjectProperty subclass suitable for using with new.

		Parameters (all are optional):
			shadowType: one of a pojo or class. This parameter defines the new property
				shadow. If pojo specified, each property and function is mapped onto a SimpleShadow subclass.
			stateSpec: a StateType instance defining the Property
			specCallback: a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow, initial state, or readonly.
	*/
	static createClass(shadowType={}, stateSpec, specCallback) {
		return createPropertyClass(shadowType, stateSpec, specCallback, ObjectProperty)
	}

	/*
		Creates a StateType defining an ObjectProperty.

		Parameters:
			defn: a pojo where each property is a StateType definition and defines the properties
				for the new type.
	*/
	static objectType(defn={}) {
		const { StateType } = require("./StateTypes");
		const type = new StateType(ObjectProperty);
		var propType;

		for (let key in defn) {
			propType = defn[key];

			type.addProperty(key, defn[key]);
		}

		return type;
	}

	/*
		Used by StateTypes to determine if StateTypes.properties(propTypes) may be invoked.
	*/
	static supportsKeyedChildProperties() {
		return true;
	}
}
