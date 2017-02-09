import { assert } from "akutils";

import KeyedApi from "./KeyedApi";
import ObjectProperty from "./ObjectProperty";
import ObjectShadowImpl from "./ObjectShadowImpl";
import MapShadow from "./MapShadow";
import Property from "./Property";
import StateType from "./StateType";


/**
	Exposes a Map interface on a shadow property. The f.lux auto-shadowing process maps `objects` using
	this {@link Property} subclass.

	The default shadow class is {@link MapShadow}.

	Use `MapProperty` when you want to shadow an `object` and provide a
	[`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) interface
	for manipulating and accessing `object` properties.

	The `_keyed` instance variable exposes a {@link KeyedApi} instance for working with properties.
	Readonly properties cannot be updated using the shadow so the `this._keyed` is used set the value
	or remove it from the object. For example,

	```js
	this._keyed.set("updated", Date());
	```
	would set the `updated` shadow property with a string value for the current time.

	@see {@link KeyedApi}
	@see {@link MapShadow}
*/
export default class MapProperty extends Property {
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
		this.setShadowClass(MapShadow)
	}

	/**
		Factory function for creating an `MapProperty` subclass suitable for using with new. The generated
		class will have the `type` {@link StateType} descriptor set upon return.

		Example usage:
		```
		class SomeShadow extends MapShadow {
		    // definition here
		}

		export default MapProperty.createClass(SomeShadow, type => {
			// configure type variable
		});
		```

		@param {Object|MapShadow} [shadowType={}] - `MapShadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state,
			or readonly.
		@param {Object} [initialState={}] - the initial state for the new property.

		@return {MapProperty} newly defined `MapProperty` subclass.
	*/
	static createClass(shadowType={}, typeCallback, initialState={}) {
		return createPropertyClass(shadowType, initialState, typeCallback, MapProperty);
	}

	/**
		Factory function for setting up the {@link StateType} `type` class variable with an appropriately
		configured intial state.

		Example usage:
		```
        export default class SomeProperty extends MapProperty {
			// implement property here
        }

        class SomeShadow extends MapShadow {
			// implement shadow api here
        }

        MapProperty.defineType(SomeProperty, SomeShadow, type => {
			// configure type variable
        });
		```

		@param {MapProperty} PropClass - MapProperty subclass
		@param {Object|MapShadow} [ShadowType] - `MapShadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state, or
			readonly.
		@param {Object} [initialState={}] - the initial state for the new property.
	*/
	static defineType(PropClass, ShadowType, typeCallback, initialState={}) {
		assert( a => a.is(MapProperty.isPrototypeOf(PropClass), "PropClass must subclass MapProperty") );

		StateType.defineTypeEx(PropClass, ShadowType, typeCallback, initialState);
	}
}


StateType.defineType(MapProperty, spec => spec.initialState({}).typeName("MapProperty") );
