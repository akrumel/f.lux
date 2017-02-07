import { assert } from "akutils";

import createPropertyClass from "./createPropertyClass";
import KeyedApi from "./KeyedApi";
import ObjectShadowImpl from "./ObjectShadowImpl";
import Property from "./Property";
import Shadow from "./Shadow";
import StateType from "./StateType";


/**
	A generic object property type that supports keyed child properties. The default implementation class is
	{@link ObjectShadowImpl}.

	The default shadow class is {@link Shadow}.
*/
export default class ObjectProperty extends Property {
	constructor(stateType) {
		super(stateType);

		this._keyed = new KeyedApi(this);

		this.setImplementationClass(ObjectShadowImpl);
		this.setShadowClass(Shadow);
	}

	/**
		Factory function for creating an {@link ObjectProperty} subclass suitable for using with new.

		@param {Object|Shadow} [shadowType={}] - one of a pojo or class. This parameter defines the new property
				shadow. If pojo specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the {@link StateType}
				spec for additional customization, such as setting autoshadow, initial state, or readonly.
		@param {Object} [initialState]={} - the initial state for the new property. (default is {})
	*/
	static createClass(shadowType={}, typeCallback, initialState={}) {
		return createPropertyClass(shadowType, initialState, typeCallback, ObjectProperty);
	}

	/**
		Factory function for creating a {@link StateType} with an appropriately set intial state.

		@param {ObjectProperty} PropClass - ObjectProperty subclass
		@param {Object|Shadow} [ShadowType=Shadow] - Shadow subclass
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the {@link StateType}
				spec for additional customization, such as setting autoshadow, initial state, or readonly.
		@param {Object} [initialState={}] - the initial state for the new property.
	*/
	static defineType(PropClass, ShadowType, typeCallback, initialState={}) {
		assert( a => a.is(ObjectProperty.isPrototypeOf(PropClass), "PropClass must subclass ObjectProperty") );

		return StateType.defineTypeEx(PropClass, ShadowType, typeCallback, initialState);
	}
}


StateType.defineType(ObjectProperty, spec => spec.initialState({}).typeName("ObjectProperty") );

