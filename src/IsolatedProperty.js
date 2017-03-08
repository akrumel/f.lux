import { assert, uuid } from "akutils";

import IsolatedAccess from "./IsolatedAccess";
import IsolatedShadow from "./IsolatedShadow";
import IsolatedShadowImpl from "./IsolatedShadowImpl";
import KeyedApi from "./KeyedApi";
import MapProperty from "./MapProperty";
import Property from "./Property";
import StateType from "./StateType";


// child property names
export const _dataKey = "data";

// private instance variable symbols
const _id = Symbol("id");
const _key = Symbol("key");
const _owner = Symbol("owner");


/**

*/
export default class IsolatedProperty extends Property {
	/**
		If a {@link StateType} is not passed to this constructor then one is located using
		{@link StateType.from} thus ensuring the f.lux shadowing process is defined for this
		property.

		@param {StateType} [stateType] - a specialized {@link StateType} instance describing how f.lux should
			shadow this property.
	*/
	constructor(stateType) {
		super(stateType);

//		assert( a => a.is(stateType.getManagedType(), "Managed type must be set") );

		this._keyed = new KeyedApi(this);

		this.setImplementationClass(IsolatedShadowImpl);
		this.setShadowClass(IsolatedShadow);

		const managedType = this.stateType().getManagedType();
		const shader = this.shader();

//		shader.addProperty(_dataKey, managedType);

		this[_id] = uuid("_");
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

		@param {Object|IsolatedShadow} [shadowType={}] - `MapShadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state,
			or readonly.
		@param {Object} [initialState={}] - the initial state for the new property.

		@return {MapProperty} newly defined `MapProperty` subclass.
	*/
	static createClass(shadowType={}, typeCallback, initialState={}) {
		return createPropertyClass(shadowType, initialState, typeCallback, IsolatedProperty);
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

        IsolatedProperty.defineType(SomeProperty, SomeShadow, type => {
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
		assert( a => a.is(IsolatedProperty.isPrototypeOf(PropClass), "PropClass must subclass IsolatedProperty") );

		StateType.defineTypeEx(PropClass, ShadowType, typeCallback, initialState);
	}

	/**
		Used by {@link StateType} to determine if a keyed property type.

		@ignore
	*/
	static supportsKeyedChildProperties() { return true }


	//------------------------------------------------------------------------------------------------------
	// Life-cycle methods
	//------------------------------------------------------------------------------------------------------

	propertyChildInvalidated(childProperty, sourceProperty) {
		this.store().isolated().invalidated(this);
	}


	//------------------------------------------------------------------------------------------------------
	// Isolated specific methods
	//------------------------------------------------------------------------------------------------------

	/**
		Gets the ID used by the store to track this isolated property.

		@return {string}
	*/
	isolationId() {
		return this[_id];
	}

	key() {
		return this[_key];
	}

	/**
		Gets the property managing this isolated object.

		@return {Property}
	*/
	owner() {
		return this[_owner];
	}

	setKey(key) {
		this[_key] = key;
	}

	/**
		Sets the property that owns/contains this isolated property.

		@param {Property} owner - the object containing/managing this isolated property.
	*/
	setOwner(owner) {
		assert( a => a.not(this[_owner], "Owner already set") );

		this[_owner] = owner;
	}


	//------------------------------------------------------------------------------------------------------
	// Property class overrides - no need to call super
	//
	// These are mostly proxies to the owner property
	//------------------------------------------------------------------------------------------------------

	/**
		Creates the object to be assigned to the shadow.$ property. Subclasses can override this method
		to setup a chain of specialized accessors (`$()`). See {@link Access} for details on setting up
		specialized accessors. This is an advanced feature and rarely required.

		@return {Access} a property accessor instance.
	*/
	create$(impl) {
		return new IsolatedAccess(impl);
	}

	/**
		An isolated property returns owner's `dotPath()` value.

		@return {string} path with each component joined by a `.`

		@see https://lodash.com/docs/4.17.4#result
	*/
	dotPath() {
		return this[_owner].dotPath();
	}

	/**
		An isolated property returns owner's `isActive()` value.

		@return {boolean}
	*/
	isActive() {
		return this[_owner].isActive() && super.isActive();
	}

	/**
		Gets if property is an actual isolated property managed by the store.

		@return {boolean}
	*/
	isIsolated() {
		return true;
	}

	/**
		An isolated property is never a root.

		@return {boolean} `false`
	*/
	isRoot() {
		return false;
	}

	/**
		An isolated property returns owner property for the parent.

		@return {[]}
	*/
	parent() {
		return this[_owner];
	}


	//------------------------------------------------------------------------------------------------------
	// Property class overrides - the tricky ones
	//
	// Developer Note: Use great caution when overriding these methods as not their original intent
	//------------------------------------------------------------------------------------------------------

	/**
		An isolated property returns owner's `isReadonly()` value.

		@return {boolean}
	*/
	isReadonly() {
		const explicit = this.readonlyExplicit();
		const readonly = explicit !== undefined ?explicit :this.stateType()._readonly;

		// use readonly flag if explicitly set otherwise use value from owner
		return readonly === undefined
			? this[_owner].isReadonly()
			: readonly;
	}
}


StateType.defineType(IsolatedProperty, spec => {
	spec.initialState({})
		.typeName("IsolatedProperty")
});