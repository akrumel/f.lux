import { assert } from "akutils";
import cloneDeep from "lodash.clonedeep";
import defaults from "lodash.defaults";
import isArray from "lodash.isarray";
import isPlainObject from "lodash.isplainobject";

import Shadow from "./Shadow";
import ShadowImpl from "./ShadowImpl";


/*
	Defines the shadowing behavior for a property. f.lux uses StateType instances to configure Shader
	instances that are then used to proxy the store's state using shadow properties.

	Property subclasses usually expose a 'type' class variable to specify their default shadowing behavior.
	The 'type' class variable should be a getter property and is typically attached to the class using the
	StateType.defineType() function.

	Example of defining a 'type' class variable:

		StateType.defineType(TodoRootProperty, spec => {
			spec.initialState({})                       // empty object initial state
				.autoshadowOff                          // do not shadow state values without explicit sub-property definitions
				.properties({                           // define sub-properties (just one in this case)
						todos: TodoCollection.type,     // 'todos' is a collection property
					})
				.readonly                               // prevent application code from reassigning the 'todos' collection (paranoia)
				.typeName("TodoRootProperty");          // useful for certain diagnostic situations
		});

	Shadowing behavior may be customized by setting the following StateType values:

		* autoshadow - shadow implicit state properties using default f.lux property types (default=true)
		* defaults - specifies default values for an object's initial state. A default value is applied
			when the initial state for this property is 'undefined'. (default=undefined)
		* element type - StateType used for shadowing each sub-property, such as elements in an array or
			properties of an object. (default=null)
		* implementation class - ShadowImpl subclass used to back shadow state property (default=null)
		* initial state - the initial property value. The store's state will take precedence and this value
			is used when the store's state is undefined for the specific property. (default=undefined)
		* managed type - StateType instance used by CollectionProperty to specify the property type for
			each model contained in the collection. Other collection types could utilize the same
			mechanism. (default=null)
		* properties - literal object with name/value pairs where name is the sub-property name and the
			value is a StateType instance describing the property shadowing behavior (default={})
		* shadow class - Shadow subclass used to represent a shadow state property. Built-in implementation
			classes set a default so only need to set when want to customize parent type default. (default=null)

	Methods/properties used when setting up a StateType description:

		* addProperty(name, type) - add a single property type where 'name' is the sub-property name and
			value is a StateType. Consider using StateType.properties() instead.
		* autoshadow - turn on auto-shadowing (default)
		* autoshadowOff - turn off auto-shadowing
		* default(state) - used with ObjectProperty and MapProperty sub-properties to set defaults for
			values. The default value is only applied if the initial state for this property is
			undefined.

			Example usage:
				stateType.properties({
					name: PrimitiveProperty.type.default(null),
				})

		* elementType(type) - StateType for shadowing each sub-property. Regularly used with IndexedProperty
			and ArrayProperty. Used with ObjectProperty and MapProperty when each value is the same type such
			as in a dictionary.
		* implementationClass(cls) - sets the ShadowImpl subclass to be used for backing the shadow state
			(should not be needed)
		* initialState(state) - value suitable for the property type: boolean, array, object,...
		* managedType(type) - StateType for shading managed properties (used with CollectionProperty)

			Example usage:
				stateType.managedType(TodoProperty.type)

		* properties(propTypes) - add multiple properties using a literal object with property-name/StateType
			key/value pairs

			Example usage:
				stateType.properties({
						completed: PrimitiveProperty.type.initialState(false),
						created: PrimitiveProperty.type.readonly,
						desc: PrimitiveProperty.type,
						id: PrimitiveProperty.type.readonly,
					})

		* readonly - set property to readonly
		* readonlyOff - set property to read/write (default unless parent property has set readonly to true
			since readonly property cascades through the state tree)
		* typeName(name) - set a label for the type. Useful for debugging situations where shadowing is
			not acting as expected.

			Example usage:

				const root = store.shadow;
				const rootProperty = root.$$();

				console.log(rootProperty.typeName())
				console.log(rootProperty.stateType().getTypeName())

	Instance of this class are rarely directly created and instead are created using the defineType()
	static function.
*/
export default class StateType {
	constructor() {
		assert( a => a.not(arguments.length, "StateType constructor takes no arguments") );

		this._PropertyClass = undefined
		this._autoshadow = true;
		this._defaults = undefined;
		this._elementType = null;
		this._implementationClass = null;
		this._initialState = undefined;
		this._managedType = null;
		this._properties = {};
		this._shadowClass = null;
		this._typeName = null;

		// readonly is different than other instance variables as readonly state cascades down
		// to properties where not explicitly set to true or false
		this._readonly = undefined;
	}

	/*
		Convenience class method to avoid using 'new StateType(...)' making chaining on the
		newly created StateType easier to read.
	*/
	static create(PropertyClass) {
		return new StateType().propertyClass(PropertyClass);
	}

	/*
		Sets a 'type' getter on the PropertyClass. The 'type' getter is used to define properties
		in the StateType.properties() method. The 'type' getter may be set once per class and all
		further requests are ignored.

		Example usage:

			StateType.defineType(CounterProperty);

			...

			ObjectProperty.createClass({}, null, spec => {
				spec.properties({
						counter: CounterProperty.type.readonly,
					})
			});

		Parameters:
			PropertyClass - the Property subclass on which to define the 'type' getter
			typeCallback - callback of form cb(spec) that allows the StateType to be customized
	*/
	static defineType(PropertyClass, typeCallback) {
		assert( a => a.not(PropertyClass.hasOwnProperty("type"), `'type' variable already defined`) );

		if (PropertyClass.hasOwnProperty("type")) { return }

		/*
			Create the basis for the returned 'type'. The type getter needs to return a copy to permit
			modifying the shadowing behavior.
		*/
		const type = new StateType();

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

	/*
		Walks the prototype chain and returns the first StateType returned by a 'type' class variable.

		Parameters:
			prop - one of a Property instance or a Property class prototype

		Returns the StateType describing the property
	*/
	static from(prop) {
		const ctor = prop.constructor;

		/*
			Get the prototype of prop. two cases
				1) prop is Property instance - proto will be its prototype
				2) prop is actually a prototype - proto will then be the parent prototype
		*/
		const proto = Object.getPrototypeOf(prop);

		return ctor.type ||
			StateType.from(ctor === proto.constructor ?Object.getPrototypeOf(proto) :proto);
	}

	/*
		Determines the ShadowImpl subclass to use for the property.
	*/
	static implementationClassForProperty(property, defaultClass=ShadowImpl) {
		var stateType = StateType.from(property);

		if (stateType && stateType._implementationClass) {
			return stateType._implementationClass;
		} else {
			return defaultClass;
		}
	}


	//---------------------------------------------------------------------------------------------
	//  StateType setup API
	//---------------------------------------------------------------------------------------------

	get autoshadow() {
		this._autoshadow = true;

		return this;
	}

	get autoshadowOff() {
		this._autoshadow = false;

		return this
	}

	get readonly() {
		this._readonly = true;

		return this;
	}

	get readonlyOff() {
		this._readonly = false;

		return this;
	}

	addProperty(name, type) {
		assert( a => {
				a.is(isKeyedPrototype(this._PropertyClass),
					"PropertyClass must be a subclass of KeyedProperty")
			});

		this._properties[name] = type;
	}

	default(state) {
		this._defaults = state;

		return this;
	}

	elementType(type) {
		this._elementType = type;

		return this;
	}

	implementationClass(cls) {
		this._implementationClass = cls;

		return this;
	}

	initialState(state) {
		this._initialState = state;

		return this;
	}

	managedType(type) {
		this._managedType = type;

		return this;
	}

	propertyClass(PropertyClass) {
		this._PropertyClass = PropertyClass;

		return this;
	}

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

	shadowClass(cls) {
		this._shadowClass = cls;

		return this;
	}

	typeName(name) {
		this._typeName = name;
		this._PropertyClass.__fluxTypeName__ = name;

		return this;
	}


	//---------------------------------------------------------------------------------------------
	//  StateType runtime API used during the shadowing process
	//---------------------------------------------------------------------------------------------

	clone() {
		return Object.assign(new StateType(), this);
	}

	computeInitialState() {
		const state = cloneDeep(this._initialState);
		const propSpecs = this._properties;

		if (!isPlainObject(state) || !propSpecs) { return state; }

		var propType, propState;

		for (let name in propSpecs) {
			propType = propSpecs[name];
			propState = state[name];

			// update state only if current undefined
			state[name] = propState===undefined ?propType.computeInitialState() :propState;
		}

		return state;
	}

	/*
		Configures an existing shader with the values of this type.
	*/
	configureShader(shader) {
		shader.setAutoshadow(this._autoshadow);

		this._setupShader(shader);
	}

	createProperty() {
		return new this._PropertyClass(this);
	}

	/*
		Returns a PropertyFactoryShader that will create property instances as configured by this StateType.
	*/
	factory(parentProperty) {
		const PropertyFactoryShader = require("./PropertyFactoryShader").default;
		const shader = new PropertyFactoryShader(this, parentProperty);

		this._setupShader(shader);

		return shader;
	}

	getManagedType() {
		return this._managedType;
	}

	getTypeName() {
		return this.ProperClass.__fluxTypeName__;
	}

	initialStateWithDefaults(state) {
		var arrayType = isArray(state);
		var defaultState, propType, propState;

		if (!isPlainObject(state) && !arrayType) { return state; }

		var propSpecs = this._properties;

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

	isComplex() {
		return Object.keys(this._properties).length || this._managedType || this._elementType;
	}

	shader(property) {
		const Shader = require("./Shader").default;
		const shader = new Shader(property);

		this._setupShader(shader);

		return shader;
	}

	shadowClassForProperty(defaultClass=Shadow) {
		if (this._shadowClass) {
			return this._shadowClass;
		} else {
			return defaultClass;
		}
	}

	_setupShader(shader) {
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


function isKeyedPrototype(obj) {
	const ObjectProperty = require("./ObjectProperty").default;
	const Property = require("./Property").default;

	return ObjectProperty === obj || ObjectProperty.isPrototypeOf(obj) ||
		(Property.isPrototypeOf(obj) && obj.supportsKeyedChildProperties && obj.supportsKeyedChildProperties());
}
