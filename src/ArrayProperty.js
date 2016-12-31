import createPropertyClass from "./createPropertyClass";
import ArrayShadow from "./ArrayShadow";
import IndexedProperty from "./IndexedProperty";
import MapProperty from "./MapProperty";
import StateType from "./StateType";


export default class ArrayProperty extends IndexedProperty {
	constructor(stateType) {
		super(stateType);

		this.setShadowClass(ArrayShadow);
	}

	/*
		Factory function for creating an ArrayProperty subclass suitable for using with new.

		Parameters (all are optional):
			shadowType: one of a pojo or class. This parameter defines the new property
				shadow. If pojo specified, each property and function is mapped onto a Shadow subclass.
			specCallback: a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow, initial state, or readonly.
			initialState: the initial state for the new property. (default is [])
	*/
	static createClass(shadowType={}, specCallback, initialState=[]) {
		return createPropertyClass(shadowType, initialState, specCallback, ArrayProperty, ArrayShadow);
	}
}


StateType.defineType(ArrayProperty, spec => {
	spec.initialState([])
		.elementType(MapProperty.type);
});
