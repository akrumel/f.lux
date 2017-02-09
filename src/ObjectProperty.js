import { assert } from "akutils";

import createPropertyClass from "./createPropertyClass";
import KeyedApi from "./KeyedApi";
import ObjectShadowImpl from "./ObjectShadowImpl";
import Property from "./Property";
import Shadow from "./Shadow";
import StateType from "./StateType";


/**
	A generic object property type that supports keyed child properties access.

	The default shadow class is {@link Shadow}.

	Use `ObjectProperty` when you want to place a full custom API on a javascript object or just want
	an object without any methods. By default, properties can be accessed/updated using dot syntax and
	the shadow does not provide any access or property manipulation methods.

	The `_keyed` instance variable exposes a {@link KeyedApi} instance for working with properties.
	Readonly properties cannot be updated using the shadow so the `this._keyed` is used set the value
	or remove it from the object. For example,

	```js
	this._keyed.set("updated", Date());
	```
	would set the `updated` shadow property with a string value for the current time.

	@see {@link KeyedApi}
	@see {@link Shadow}
*/
export default class ObjectProperty extends Property {
	/**
		If a {@link StateType} is not passed to this constructor then one is located using
		{@link StateType.from} thus ensuring the f.lux shadowing process is defined for this
		property.

		@param {StateType} [stateType] - a specialized {@link StateType} instance describing how f.lux should
			shadow this property.
	*/
	constructor(stateType) {
		super(stateType);

		this._keyed = new KeyedApi(this);

		this.setImplementationClass(ObjectShadowImpl);
		this.setShadowClass(Shadow);
	}

	/**
		Factory function for creating an `ObjectProperty` subclass. The generated class will have
		the `type` {@link StateType} descriptor set upon return.

		Example usage:
		```
		class UiShadow extends Shadow {
		    // definition here
		}

		export default ObjectProperty.createClass(UiShadow, type => {
			// configure type variable
		});
		```

		@param {Object|Shadow} [shadowType={}] - `Shadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state,
			or readonly.
		@param {Object} [initialState]={} - the initial state for the new property.

		@return {ObjectProperty} newly defined `ObjectProperty` subclass.
	*/
	static createClass(shadowType={}, typeCallback, initialState={}) {
		return createPropertyClass(shadowType, initialState, typeCallback, ObjectProperty);
	}

	/**
		Factory function for setting up the {@link StateType} `type` class variable with an appropriately
		configured intial state.

		Example usage:
		```
        export default class TodoProperty extends ObjectProperty {
			// implement property here
        }

        class TodoShadow extends Shadow {
			// implement shadow api here
        }

        ObjectProperty.defineType(TodoProperty, TodoShadow, type => {
			// configure type variable
        });
		```

		@param {ObjectProperty} PropClass - `ObjectProperty` subclass
		@param {Object|Shadow} [ShadowType] - Shadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state, or
			readonly.
		@param {Object} [initialState={}] - the initial state for the new property.
	*/
	static defineType(PropClass, ShadowType, typeCallback, initialState={}) {
		assert( a => a.is(ObjectProperty.isPrototypeOf(PropClass), "PropClass must subclass ObjectProperty") );

		StateType.defineTypeEx(PropClass, ShadowType, typeCallback, initialState);
	}
}


StateType.defineType(ObjectProperty, spec => spec.initialState({}).typeName("ObjectProperty") );

