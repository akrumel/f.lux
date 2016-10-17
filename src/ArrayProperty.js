
import ArrayShadow from "./ArrayShadow";
import IndexedProperty from "./IndexedProperty";
import StateType from "./StateType";


export default class ArrayProperty extends IndexedProperty {
	constructor(initialState, autoShadow, readonly) {
		super(initialState, autoShadow, readonly);

		this.setShadowClass(ArrayShadow);
	}

	/*
		Factory function for creating an ArrayProperty subclass suitable for using with new.

		Parameters (all are optional):
			shadowType: one of a pojo or class. This parameter defines the new property
				shadow. If pojo specified, each property and function is mapped onto a Shadow subclass.
			stateSpec: a StateType instance defining the Property
			specCallback: a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow, initial state, or readonly.
	*/
	static createClass(shadowType={}, stateSpec, specCallback) {
		return createPropertyClass(shadowType, stateSpec, specCallback, ArrayProperty);
	}
}


Object.defineProperty(ArrayProperty, "type", {
		get: () => new StateType(ArrayProperty)
	})