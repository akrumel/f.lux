import { assert } from "akutils";

import createPropertyClass from "./createPropertyClass";
import KeyedApi from "./KeyedApi";
import ObjectShadowImpl from "./ObjectShadowImpl";
import Property from "./Property";
import Shadow from "./Shadow";
import StateType from "./StateType";


/*
	A generic object property type that supports keyed child properties. The default implementation class is
	ObjectShadowImpl. The default shadow class is Shadow.
*/
export default class ObjectProperty extends Property {
	constructor(stateType) {
		super(stateType);

		this._keyed = new KeyedApi(this);

		this.setImplementationClass(ObjectShadowImpl);
		this.setShadowClass(Shadow);
	}

	/*
		Factory function for creating an ObjectProperty subclass suitable for using with new.

		Parameters (all are optional):
			shadowType: one of a pojo or class. This parameter defines the new property
				shadow. If pojo specified, each property and function is mapped onto a Shadow subclass.
			specCallback: a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow, initial state, or readonly.
			initialState: the initial state for the new property. (default is {})
	*/
	static createClass(shadowType={}, specCallback, initialState={}) {
		return createPropertyClass(shadowType, initialState, specCallback, ObjectProperty);
	}

	/*
		Factory function for creating a StateType with an appropriately set intial state.

		Parameters:
			PropClass: ObjectProperty subclass (required)
			ShadowClass: Shadow subclass (optional)
			specCallback: a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow or readonly. (optional)
			initialState: the initial state for the new property. (default is {})
	*/
	static defineType(PropClass, ShadowType, specCallback, initialState={}) {
		assert( a => a.is(ObjectProperty.isPrototypeOf(PropClass), "PropClass must subclass ObjectProperty") );

		return StateType.defineTypeEx(PropClass, ShadowType, specCallback, initialState);
	}
}


StateType.defineType(ObjectProperty, spec => spec.initialState({}).typeName("ObjectProperty") );

