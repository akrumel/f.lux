import { assert } from "akutils";
import Symbol from "es6-symbol";
import cloneDeep from "lodash.clonedeep";
import defaults from "lodash.defaults";
import isArray from "lodash.isarray";
import isPlainObject from "lodash.isplainobject";

import Access from "./Access";
import Shadow from "./Shadow";
import ShadowImpl from "./ShadowImpl";


// private method symbols
const _setupShader = Symbol('setupShader');


/**
	Defines the shadowing behavior for a property. f.lux uses StateType instances to configure {@link Shader}
	instances that are then used to proxy the store's state using shadow properties.

	Property subclasses usually expose a `type`'` class variable to specify their default shadowing behavior.
	The `type` class variable should be a getter property and is typically attached to the class using the
	`StateType.defineType()`` function.

	Example of defining a `type` class variable:

	<pre class="prettyprint">
		StateType.defineType(TodoRootProperty, type => {
		&zwnj;	type.initialState({})                           // empty object initial state
		&zwnj;		.autoshadowOff                          // do not shadow state values without explicit definitions
		&zwnj;		.properties({                           // define sub-properties (just one in this case)
		&zwnj;			todos: TodoCollection.type,     // 'todos' is a collection property
		&zwnj;		})
		&zwnj;		.readonly                               // prevent reassigning the 'todos' collection (paranoia)
		&zwnj;		.typeName("TodoRootProperty");          // useful for certain diagnostic situations
		});
	</pre>

	Shadowing behavior may be customized by setting the following StateType values:
	<ul>
		<li>autoshadow - shadow implicit state properties using default f.lux property types (default=true)</li>
		<li>defaults - specifies default values for an object's initial state. A default value is applied
			when the initial state for this property is 'undefined'. (default=undefined)</li>
		<li>element type - StateType used for shadowing each sub-property, such as elements in an array or
			properties of an object. (default=null)</li>
		<li>jit properties - dynamically extends the 'properties' based on the property's state through a
			callback function (experimental)</li>
		<li>implementation class - ShadowImpl subclass used to back shadow state property (default=null)
		<li>initial state - the initial property value. The store's state will take precedence and this value
			is used when the store's state is undefined for the specific property. (default=undefined)</li>
		<li>managed type - StateType instance used by CollectionProperty to specify the property type for
			each model contained in the collection. Other collection types could utilize the same
			mechanism. (default=null)</li>
		<li>properties - literal object with name/value pairs where name is the sub-property name and the
			value is a StateType instance describing the property shadowing behavior (default={})</li>
		<li>shadow class - Shadow subclass used to represent a shadow state property. Built-in implementation
			classes set a default so only need to set when want to customize parent type default.
			(default=null)</li>
	</ul>

	Methods/properties used when setting up a `StateType` description:
	<ul>
		<li>`addProperty(name, type)` - add a single property type where 'name' is the sub-property name and
			value is a StateType. Consider using StateType.properties() instead.</li>
		<li>`autoshadow` - turn on auto-shadowing (default)</li>
		<li>`autoshadowOff` - turn off auto-shadowing</li>
		<li>`default(state)` - used with ObjectProperty and MapProperty sub-properties to set defaults for
			values. The default value is only applied if the initial state for this property is
			undefined.

			Example usage:
			<pre class="prettyprint">
				stateType.properties({
				&zwnj;	name: PrimitiveProperty.type.default(null),
				})
			</pre>
		</li>
		<li>`elementType(type)` - StateType for shadowing each sub-property. Regularly used with IndexedProperty
			and ArrayProperty. Used with ObjectProperty and MapProperty when each value is the same type such
			as in a dictionary.</li>
		<li>`jitProperties(callback)` - Sets a callback used for dynamically extending properties definition. Callback
			signature is 'callback(state, parentProperty)' and returns object with name/value pairs where name
			is the sub-property name and the value is a StateType instance describing the property shadowing behavior.
			(advanced feature)</li>
		<li>`implementationClass(cls)` - sets the ShadowImpl subclass to be used for backing the shadow state
			(should not be needed)</li>
		<li>`initialState(state)` - value suitable for the property type: boolean, array, object,...</li>
		<li>`managedType(type)` - StateType for shading managed properties (used with CollectionProperty)

			Example usage:
			<pre class="prettyprint">
			stateType.managedType(TodoProperty.type)
			</pre>
		</li>
		<li>`properties(propTypes)` - add multiple properties using a literal object with property-name/StateType
			key/value pairs

			Example usage:
			<pre class="prettyprint">
				stateType.properties({
				&zwnj;	completed: PrimitiveProperty.type.initialState(false),
				&zwnj;	created: PrimitiveProperty.type.readonly,
				&zwnj;	desc: PrimitiveProperty.type,
				&zwnj;	id: PrimitiveProperty.type.readonly,
				})
			</pre>
		</li>
		<li>`readonly` - set property to readonly
		<li>`readonlyOff` - set property to read/write (default unless parent property has set readonly to true
			since readonly property cascades through the state tree)
		<li>`typeName(name)` - set a label for the type. Useful for debugging situations where shadowing is
			not acting as expected.

			Example usage:

			<pre class="prettyprint">
				const root = store.shadow;
				const rootProperty = root.$$();

				console.log(rootProperty.typeName());
				console.log(rootProperty.stateType().getTypeName());
			</pre>
		</li>
	</ul>

	Instances of this class are rarely directly created and instead are created using the `defineType`
	static functions of each built-in property class.

	@see {@link ArrayProperty}
	@see {@link CollectionProperty}
	@see {@link IndexedProperty}
	@see {@link MapProperty}
	@see {@link ObjectProperty}
*/
export default class StateType {
	constructor() {
		assert( a => a.not(arguments.length, "StateType constructor takes no arguments") );

		this._PropertyClass = undefined
		this._autoshadow = true;
		this._context = null;
		this._defaults = undefined;
		this._elementType = null;
		this._implementationClass = null;
		this._initialState = undefined;
		this._managedType = null;
		this._properties = {};
		this._shadowClass = null;
		this._typeName = null;
		this._updateName = null;

		// readonly is different than other instance variables as readonly state cascades down
		// to properties where not explicitly set to true or false
		this._readonly = undefined;
	}

	/**
		Convenience class method to avoid using 'new StateType(...)' making chaining on the
		newly created StateType easier to read.

		@param {Property} PropertyClass - a {@link Property} class (not object) that shadowing
			behavior is being defined.
	*/
	static create(PropertyClass) {
		return new StateType().propertyClass(PropertyClass);
	}

	/**
		Sets a `type` getter on a {@link Property} class. The `type` getter is used to define properties
		in the {@link StateType#properties} method. The `type` getter may be set once per class and all
		further requests are ignored.

		Example usage:
		<pre class="prettyprint">
			StateType.defineType(CounterProperty);
			&zwnj;
			// and the use it
			&zwnj;
			ObjectProperty.createClass({}, type => {
			&zwnj;	type.properties({
			&zwnj;		counter: CounterProperty.type.readonly,
			&zwnj;	})
			});
		</pre>

		@param {Property} PropertyClass - the {@link Property} subclass on which to define the `type` getter
		@param {function} typeCallback - callback of form `cb(type)` that allows the {@link StateType} to be
			customized
	*/
	static defineType(PropertyClass, typeCallback) {
		assert( a => a.not(PropertyClass.hasOwnProperty("type"), `'type' variable already defined`) );

		if (PropertyClass.hasOwnProperty("type")) {
			return
		}

		/*
			Create the basis for the returned 'type'. The type getter needs to return a copy to permit
			modifying the shadowing behavior.
		*/
		const baseType = PropertyClass.type;
		const type = baseType || new StateType();

		type.propertyClass(PropertyClass);

		if (typeCallback) {
			typeCallback(type);
		}

		Object.defineProperty(PropertyClass, "type", {
				get() {
					// permit modifications with altering the default case
					return type.clone();
				}
			});
	}

	/**
		Sets a `type` getter on a {@link Property} class with the ability to set the initial state. The
		`type` getter is used to define properties in the {@link StateType#properties} method. The `type`
		getter may be set once per class and all further requests are ignored.

		@param {Property} PropClass - Property subclass (required)
		@param {Shadow} [ShadowType] - Shadow subclass or will pick up default set by parent class
		@param {function} typeCallback - callback of form `cb(type)` that allows the {@link StateType} to be
			customized
		@param [initialState] - the initial state for the new property.
	*/
	static defineTypeEx(PropClass, ShadowType, typeCallback, initialState) {
		StateType.defineType(PropClass, type => {
			type.initialState(initialState);

			if (ShadowType) {
				type.shadowClass(ShadowType)
			}

			if (typeCallback) {
				typeCallback(type);
			}
		})
	}

	/**
		Walks the prototype chain and returns the first {@link StateType} returned by a `type` class
		variable.

		@param {Property} prop - one of a {@link Property} instance or class `p`rototype`

		@return the {@link StateType} describing the property
	*/
	static from(prop) {
		const ctor = prop.constructor;

		/*
			Get the prototype of prop. two cases
				1) prop is Property instance - proto will be its prototype
				2) prop is actually a prototype - proto will then be the parent prototype
		*/
		const proto = Object.getPrototypeOf(prop);

		return proto && (
				ctor.type ||
				StateType.from(ctor === proto.constructor ?Object.getPrototypeOf(proto) :proto)
			);
	}

	/**
		Determines the {@link ShadowImpl} subclass to use for the property.

		@param {Property} property - the `Property` instance to check
		@param {ShadowImpl} [defaultClass]=ShadowImpl - the `ShadowImpl` subclass to use if one is not
			specified in the `type` {@link StateType} class variable for the `property` parameter.
	*/
	static implementationClassForProperty(property, defaultClass=ShadowImpl) {
		const stateType = property.stateType();

		if (stateType && stateType._implementationClass) {
			return stateType._implementationClass;
		} else {
			return defaultClass;
		}
	}


	//---------------------------------------------------------------------------------------------
	//  StateType setup API
	//---------------------------------------------------------------------------------------------

	/**
		Shadowing configuration getter to enable auto-shadowing. Auto-shadowing is enabled by
		default and the shadowing attribute does not cascade through the state hieararchy.

		@return {StateType} this instance for use in chaining configuration calls
	*/
	get autoshadow() {
		this._autoshadow = true;

		return this;
	}

	/**
		Shadowing configuration getter to disable auto-shadowing. Auto-shadowing is enabled by
		default and the shadowing attribute does not cascade through the state hieararchy.

		@return {StateType} this instance for use in chaining configuration calls
	*/
	get autoshadowOff() {
		this._autoshadow = false;

		return this
	}

	get isolated() {
		this._isolated = true;

		return this;
	}

	get isolatedOff() {
		this._isolated = false;

		return this;
	}

	/**
		Shadowing configuration getter to set the readonly attribute. Readonly is disabled by
		default and the attribute cascades through the state hieararchy. This means all child
		properties will be readonly once an upper level property's `readonly` attribute is enabled
		until explicitly disabled using {@link StateType#readonlyOff}.

		@return {StateType} this instance for use in chaining configuration calls
	*/
	get readonly() {
		this._readonly = true;

		return this;
	}

	/**
		Shadowing configuration getter to disable the readonly attribute. Readonly is disabled by
		default and the attribute cascades through the state hieararchy. This means all child
		properties will be readonly once an upper level property's `readonly` attribute is enabled
		until explicitly disabled using {@link StateType#readonlyOff}.

		@return {StateType} this instance for use in chaining configuration calls
	*/
	get readonlyOff() {
		this._readonly = false;

		return this;
	}

	/**
		Shadowing configuration method to add a child property. The current implementation support
		'keyed' properties only, such as {@link ObjectProperty} and {@link MapProperty}.

		Consider using {@link StateType#properties} for adding multiple properties.

		@param {string} name - the property key
		@param {StateType} type - the property `StateType` descriptor

		@return {StateType} this instance for use in chaining configuration calls
	*/
	addProperty(name, type) {
		assert( a => {
				a.is(isKeyedPrototype(this._PropertyClass),
					"PropertyClass must be a subclass of KeyedProperty");
				a.is(type instanceof StateType, "'type' parameter not StateType")
			});

		this._properties[name] = type;

		return this;
	}

	/**
		Sets the default property values for child properties. A default value is used when the
		{@link Store} state and the property `type` descriptor's initial state are not defined.

		@param state - the default state value

		@return {StateType} this instance for use in chaining configuration calls
	*/
	default(state) {
		this._defaults = state;

		return this;
	}

	/**
		Sets the callback for generating the context for this property. Callback must be of the
		form: fn(prop) { return { ...} }.
	*/
	context(callback) {
		this._context = callback;

		return this;
	}

	/**
		Sets the `StateType` to use for shadowing each immediate child property.

		@param {StateType} type - `StateType` instance

		@return {StateType} this instance for use in chaining configuration calls
	*/
	elementType(type) {
		assert( a => a.is(type instanceof StateType, "'type' parameter not StateType") );

		this._elementType = type;

		return this;
	}

	/**
		The {@link ShadowImpl} class to use for backing the properties {@link Shadow}. This
		rarely required.

		@return {StateType} this instance for use in chaining configuration calls
	*/
	implementationClass(cls) {
		this._implementationClass = cls;

		return this;
	}

	/**
		Sets the initial state for the property if the f.lux store's state does not have a
		value for this property.

		@param state - the initial value
		@return {StateType} this instance for use in chaining configuration calls
	*/
	initialState(state) {
		this._initialState = state;

		return this;
	}

	/**
		Sets a callback used for dynamically extending the child property definitions. Callback signature is:

		```
			callback(state, parentProperty)
		```

		where:
		<ul>
			<li>`state` - the parent property state</li>
			<li>`parentProperty` - the parent property</li>
		</ul>

		@param {function} callback - the function to call during the shadowing process to obtain any
			additional property definitions beyond those statically configured.

		@return `object` with name/value pairs where name is the sub-property name and the
			value is a `StateType` instance describing the property shadowing behavior.
	*/
	jitProperties(callback) {
		assert( a => a.is(typeof callback === "function", "'callback' parameter not a function") );

		this._jitProperties = callback;
	}

	/**
		Sets the `StateType` for the 'managed type'. Complex {@link Property} subclasses use the
		managed type for determining how to shadow contained data. More common is the use of
		{@link StateType#elementType} to specify a `StateType` for each immediate child property.

		See {@link CollectionProperty} for an example of a property employing managed types.

		@param {StateType} type - the `StateType` describing how to shadow each managed state value.

		@return {StateType} this instance for use in chaining configuration calls.
	*/
	managedType(type) {
		assert( a => a.is(type instanceof StateType, "'type' parameter not StateType") );

		this._managedType = type;

		return this;
	}

	/**
		Sets the {@link Property} class used for shadowing the state property.

		@param {Property} PropertyClass - a `Property` subclass

		@return {StateType} this instance for use in chaining configuration calls
	*/
	propertyClass(PropertyClass) {
		this._PropertyClass = PropertyClass;

		return this;
	}

	/**
		Sets `StateType` values describing the shadowing behavior for multiple child properties.

		@return {StateType} this instance for use in chaining configuration calls
	*/
	properties(propTypes) {
		assert( a => {
				a.is(isKeyedPrototype(this._PropertyClass),
						"PropertyClass must subclass ObjectProperty or implement supportsKeyedChildProperties()")
			});

		for (let name in propTypes) {
			this.addProperty(name, propTypes[name]);
		}

		return this;
	}

	updateName(name) {
		this._updateName = name;

		return this;
	}

	accessClass(Cls) {
		this._AccessClass = Cls;

		return this;
	}

	/**
		Sets the {@link Shadow} class to be used for shadowing the property.

		@param {Shadow} cls - The `Shadow` subclass

		@return {StateType} this instance for use in chaining configuration calls
	*/
	shadowClass(cls) {
		this._shadowClass = cls;

		return this;
	}

	/**
		Sets a descriptive type name on a property class. This is accomplished by setting the `name` on
		the {@link StateType#_PropertyClass} constructor using a variable called `__fluxTypeName__`.

		@return {StateType} this instance for use in chaining configuration calls
	*/
	typeName(name) {
		this._typeName = name;
		this._PropertyClass.__fluxTypeName__ = name;

		return this;
	}


	//---------------------------------------------------------------------------------------------
	//  StateType runtime API used during the shadowing process
	//---------------------------------------------------------------------------------------------

	/**
		Creates a shallow copy of this `StateType`

		@return {StateType}
	*/
	clone() {
		return Object.assign(
				new StateType(),
				this,
				{ _properties: { ...this._properties } }
			);
	}

	/**
		Generates the initial state for this property and its immediate child properties. This method
		does not account for any explicit default values set using {@link StateType#default}.

		@return the initial state
	*/
	computeInitialState() {
		const state = cloneDeep(this._initialState);
		const propSpecs = this._properties;
		var propType, propState;

		if (!isPlainObject(state) || !propSpecs) { return state; }

		for (let name in propSpecs) {
			propType = propSpecs[name];
			propState = state[name];

			// update state only if current undefined
			state[name] = propState===undefined ?propType.computeInitialState() :propState;
		}

		return state;
	}

	/**
		Configures an existing shader with the values of this type.

		@ignore
	*/
	configureShader(shader) {
		shader.setAutoshadow(this._autoshadow);

		this[_setupShader](shader);
	}

	/** @ignore */
	createProperty() {
		return new this._PropertyClass(this);
	}

	/**
		Returns a {@link PropertyFactoryShader} that will create property instances as configured by
		this `StateType`.

		@ignore
	*/
	factory(parentProperty) {
		const PropertyFactoryShader = require("./PropertyFactoryShader").default;
		const shader = new PropertyFactoryShader(this, parentProperty);

		this[_setupShader](shader);

		return shader;
	}

	/** @ignore */
	isAutomount() {
		return false;
	}

	/** @ignore */
	isIsolated() {
		return !!this._isolated;
	}

	/** @ignore */
	getAccessClass() {
		return this._AccessClass || Access;
	}

	/** @ignore */
	getManagedType() {
		return this._managedType;
	}

	/**
		Gets the descriptive type name from the {@link StateType#_PropertyClass}. This value is set using
		{@link StateType#typeName}.

		@return {string} the descriptive name.
	*/
	getTypeName() {
		return this._PropertyClass.__fluxTypeName__;
	}

	getUpdateName() {
		return this._updateName;
	}

	/** @ignore */
	hasJitProperties() {
		return !!this._jitProperties;
	}

	/**
		Generates the initial state for this property and its immediate child properties. The intial
		state is merged with any explicit default values set using {@link StateType#default}.

		@return the initial state
	*/
	initialStateWithDefaults(state) {
		const arrayType = isArray(state);
		const propSpecs = this._properties;
		var defaultState, propType, propState;

		if (!isPlainObject(state) && !arrayType) { return state; }

		if (isPlainObject(this._defaults)) {
			state = defaults( (arrayType ?[] :{}), state, this._defaults);
		}

		for (let name in propSpecs) {
			propType = propSpecs[name];

			if (propType && propType._defaults !== undefined) {
				defaultState = defaultState || (arrayType ?[] :{});
				defaultState[name] = propType._defaults ;
			}
		}

		if (defaultState) {
			state = defaults((arrayType ?[] :{}), state, defaultState);
		}

		return state;
	}

	/** @ignore */
	isComplex() {
		return Object.keys(this._properties).length || this._managedType || this._elementType;
	}

	/**
		Gets a shader based on just-in-time configured shader. This mechanism is used when the type structure
		is not static but based on the state contents. You could think of this as a type of polymorphism.

		Shaders returned are configured through the 'jitProperties()' setup API.

		@ignore
	*/
	jitShaderFor(name, state, property) {
		// cache types with an identity comparison (may need shallow comparison)
		if (this._jitProperties && this._jitState !== state) {
			this._jitState = state;
			this._jitTypes = this._jitProperties(state, property);
		}

		const type = this._jitTypes && this._jitTypes[name];

		return type && type.factory(property);
	}

	/** @ignore */
	shader(property) {
		const Shader = require("./Shader").default;
		const shader = new Shader(property);

		this[_setupShader](shader);

		return shader;
	}

	/** @ignore */
	shadowClassForProperty(defaultClass=Shadow) {
		if (this._shadowClass) {
			return this._shadowClass;
		} else {
			return defaultClass;
		}
	}

	/** @ignore */
	[_setupShader](shader) {
		if (this._elementType) {
			let eltType = this._elementType;

			shader.setElementType(eltType);
		} else {
			let eltType;

			for (let name in this._properties) {
				eltType = this._properties[name];

				shader.addProperty(name, eltType);
			}
		}
	}
}


/**
	Helper function to determine if a Property supports child properties.

	@ignore
*/
export function isKeyedPrototype(obj) {
	const ObjectProperty = require("./ObjectProperty").default;
	const Property = require("./Property").default;

	return Property.isPrototypeOf(obj) && obj.supportsKeyedChildProperties && obj.supportsKeyedChildProperties();
}
