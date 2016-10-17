import createPropertyClass from "./createPropertyClass";
import KeyedApi from "./KeyedApi";
import KeyedShadowImpl from "./KeyedShadowImpl";
import Property from "./Property";
import Shadow from "./Shadow";
import StateType from "./StateType";


/*
	A generic object property type that supports keyed child properties. The default implementation class is
	KeyedShadowImpl. The default shadow class is Shadow.

	Transition note: Slowly migrating API away from accessing property related entities using
		Object.defineProperty() or get xyz() and using methods instead to reduce shadowing overhead.
*/
export default class ObjectProperty extends Property {
	constructor(initialState={}, autoShadow, readonly) {
		super(initialState, autoShadow, readonly);

		this._keyed = new KeyedApi(this);

		this.setImplementationClass(KeyedShadowImpl);
		this.setShadowClass(Shadow);
	}

	/*
		Factory function for creating an ObjectProperty subclass suitable for using with new.

		Parameters (all are optional):
			shadowType: one of a pojo or class. This parameter defines the new property
				shadow. If pojo specified, each property and function is mapped onto a Shadow subclass.
			stateSpec: a StateType instance defining the Property
			specCallback: a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow, initial state, or readonly.
	*/
	static createClass(shadowType={}, stateSpec, specCallback) {
		return createPropertyClass(shadowType, stateSpec, specCallback, ObjectProperty);
	}
}


Object.defineProperty(ObjectProperty, "type", {
		get: () => new StateType(ObjectProperty)
	})