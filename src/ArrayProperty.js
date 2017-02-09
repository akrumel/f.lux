import { assert } from "akutils";

import createPropertyClass from "./createPropertyClass";
import ArrayShadow from "./ArrayShadow";
import IndexedApi from "./IndexedApi";
import IndexedShadowImpl from "./IndexedShadowImpl";
import Property from "./Property";
import MapProperty from "./MapProperty";
import StateType from "./StateType";


/**
	`ArrayProperty` models an [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
	and the shadow API exposes all `Array` methods, such as `filter()`, `push()`, `pop()`,
	and `reduce()` to name a few. The {@link ArrayShadow} allows for random access and assignment, such as
	`todos[1].desc`.

	The default shadow class is {@link ArrayShadow}.

	Use `ArrayProperty` when you want to model an array state property and allow for the use of `Array` mutation methods.
	You can then specify a custom shadow api to extend the `ArrayShadow` api.

	The `_indexed` instance variable exposes a {@link IndexedApi} instance for working with properties.
	Use `this._indexed` to perform `array` mutations, such as `pop()`, `push()`, `shift()`, and `splice()`.
	For example,

	```js
	this._indexed.push("new element");
	```
	would append "new element" to the array.

	@see {@link ArrayShadow}
*/
export default class ArrayProperty extends Property {
	constructor(stateType) {
		super(stateType);

		this._indexed = new IndexedApi(this);

		this.setImplementationClass(IndexedShadowImpl);
		this.setShadowClass(ArrayShadow);
	}

	/**
		Factory function for creating an `IndexedProperty` subclass. The generated class will have
		the `type` {@link StateType} descriptor set upon return.

		Example usage:
		```
		class SomeShadow extends ArrayShadow {
		    // definition here
		}

		export default ArrayProperty.createClass(SomeShadow, type => {
			// configure type variable
		});
		```

		@param {Object|ArrayShadow} [shadowType={}] - `ArrayShadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state,
			or readonly.
		@param {Object} [initialState]=[] - the initial state for the new property.

		@return {ArrayProperty} newly defined `ArrayProperty` subclass.
	*/
	static createClass(shadowType={}, typeCallback, initialState=[]) {
		return createPropertyClass(shadowType, initialState, typeCallback, ArrayProperty, ArrayShadow);
	}

	/**
		Factory function for setting up the {@link StateType} `type` class variable with an appropriately
		configured intial state.

		Example usage:
		```
        export default class SomeProperty extends ArrayProperty {
			// implement property here
        }

        class SomeShadow extends ArrayShadow {
			// implement shadow api here
        }

        MapProperty.defineType(SomeProperty, SomeShadow, type => {
			// configure type variable
        });
		```

		@param {ArrayProperty} PropClass - ArrayProperty subclass
		@param {Object|ArrayShadow} [ShadowType] - `ArrayShadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state, or
			readonly.
		@param {Object} [initialState=[]] - the initial state for the new property.
	*/
	static defineType(PropClass, ShadowType, typeCallback, initialState=[]) {
		assert( a => a.is(ArrayProperty.isPrototypeOf(PropClass), "PropClass must subclass ArrayProperty") );

		return StateType.defineTypeEx(PropClass, ShadowType, typeCallback, initialState);
	}
}


StateType.defineType(ArrayProperty, spec => {
	spec.initialState([])
		.elementType(MapProperty.type)
		.typeName("ArrayProperty");
});
