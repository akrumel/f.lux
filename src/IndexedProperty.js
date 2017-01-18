import { assert } from "akutils";

import createPropertyClass from "./createPropertyClass";
import IndexedApi from "./IndexedApi";
import IndexedShadow from "./IndexedShadow";
import IndexedShadowImpl from "./IndexedShadowImpl";
import MapProperty from "./MapProperty";
import Property from "./Property";
import PropertyFactoryShader from "./PropertyFactoryShader";
import StateType from "./StateType";


export default class IndexedProperty extends Property {
	constructor(stateType) {
		super(stateType);

		this._indexed = new IndexedApi(this);

		this.setImplementationClass(IndexedShadowImpl);
		this.setShadowClass(IndexedShadow);
	}

	/*
		Factory function for creating an IndexedProperty subclass suitable for using with new.

		Parameters (all are optional):
			shadowType: one of a pojo or class. This parameter defines the new property
				shadow. If pojo specified, each property and function is mapped onto a Shadow subclass.
			specCallback: a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow, initial state, or readonly.
			initialState: the initial state for the new property. (default is [])
	*/
	static createClass(shadowType={}, specCallback, initialState=[]) {
		return createPropertyClass(shadowType, initialState, specCallback, IndexedProperty, IndexedShadow);
	}

	/*
		Factory function for creating a StateType with an appropriately set intial state.

		Parameters:
			PropClass: IndexedProperty subclass (required)
			ShadowClass: Shadow subclass (optional)
			specCallback: a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow or readonly. (optional)
			initialState: the initial state for the new property. (default is [])
	*/
	static defineType(PropClass, ShadowType, specCallback, initialState=[]) {
		assert( a => a.is(IndexedProperty.isPrototypeOf(PropClass), "PropClass must subclass IndexedProperty") );

		return StateType.defineTypeEx(PropClass, ShadowType, specCallback, initialState);
	}
}


StateType.defineType(IndexedProperty, spec => {
	spec.initialState([])
		.elementType(MapProperty.type)
		.typeName("IndexedProperty");
});
