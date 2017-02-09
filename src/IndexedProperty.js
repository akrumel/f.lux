import { assert } from "akutils";

import createPropertyClass from "./createPropertyClass";
import IndexedApi from "./IndexedApi";
import IndexedShadow from "./IndexedShadow";
import IndexedShadowImpl from "./IndexedShadowImpl";
import MapProperty from "./MapProperty";
import Property from "./Property";
import PropertyFactoryShader from "./PropertyFactoryShader";
import StateType from "./StateType";


/**
	`IndexedProperty` models an [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
	while limiting the shadow API to the non-mutating `Array` methods, such as `filter()`, `find()`, `indexOf()`,
	and `map()` to name a few. The {@link IndexedShadow} allows for random access and assignment, such as
	`todos[1].desc`.

	The default shadow class is {@link IndexedShadow}.

	Use `IndexedProperty` when you want to model an array state property without exposing mutating functions
	like `push()`, `remove()`, and `splice()`. You can then specify a custom shadow api to expose mutation
	methods that involve implementation logic.

	The `_indexed` instance variable exposes a {@link IndexedApi} instance for working with properties.
	Use `this._indexed` to perform `array` mutations, such as `pop()`, `push()`, `shift()`, and `splice()`.
	For example,

	```js
	this._indexed.push("new element");
	```
	would append "new element" to the array.

	@see {@link IndexedShadow}
*/
export default class IndexedProperty extends Property {
	constructor(stateType) {
		super(stateType);

		this._indexed = new IndexedApi(this);

		this.setImplementationClass(IndexedShadowImpl);
		this.setShadowClass(IndexedShadow);
	}

	/**
		Factory function for creating an `IndexedProperty` subclass. The generated class will have
		the `type` {@link StateType} descriptor set upon return.

		Example usage:
		```
		class SomeShadow extends IndexedShadow {
		    // definition here
		}

		export default IndexedProperty.createClass(SomeShadow, type => {
			// configure type variable
		});
		```

		@param {Object|IndexedShadow} [shadowType={}] - `IndexedShadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state,
			or readonly.
		@param {Object} [initialState]=[] - the initial state for the new property.

		@return {IndexedProperty} newly defined `IndexedProperty` subclass.
	*/
	static createClass(shadowType={}, typeCallback, initialState=[]) {
		return createPropertyClass(shadowType, initialState, typeCallback, IndexedProperty, IndexedShadow);
	}

	/**
		Factory function for setting up the {@link StateType} `type` class variable with an appropriately
		configured intial state.

		Example usage:
		```
        export default class SomeProperty extends IndexedProperty {
			// implement property here
        }

        class SomeShadow extends IndexedShadow {
			// implement shadow api here
        }

        MapProperty.defineType(SomeProperty, SomeShadow, type => {
			// configure type variable
        });
		```

		@param {IndexedProperty} PropClass - IndexedProperty subclass
		@param {Object|IndexedShadow} [ShadowType] - `IndexedShadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state, or
			readonly.
		@param {Object} [initialState=[]] - the initial state for the new property.
	*/
	static defineType(PropClass, ShadowType, typeCallback, initialState=[]) {
		assert( a => a.is(IndexedProperty.isPrototypeOf(PropClass), "PropClass must subclass IndexedProperty") );

		StateType.defineTypeEx(PropClass, ShadowType, typeCallback, initialState);
	}
}


StateType.defineType(IndexedProperty, spec => {
	spec.initialState([])
		.elementType(MapProperty.type)
		.typeName("IndexedProperty");
});
