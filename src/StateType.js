import { assert } from "akutils";
import cloneDeep from "lodash.clonedeep";
import defaults from "lodash.defaults";
import isArray from "lodash.isarray";
import isPlainObject from "lodash.isplainobject";

import Shadow from "./Shadow";
import ShadowImpl from "./ShadowImpl";



/*
	Todo:
		- add managed property type support to factory shader
*/


export default class StateType {
	constructor(PropertyClass) {
		this._PropertyClass = PropertyClass;

		// setup default values
		const stateSpec = PropertyClass.stateSpec;

		this._autoshadow = stateSpec ?stateSpec._autoshadow :true;
		this._defaults = stateSpec ?stateSpec._defaults :undefined;
		this._elementType = stateSpec ?stateSpec._elementType :null;
		this._implementationClass = stateSpec ?stateSpec._implementationClass :null;
		this._initialState = stateSpec ?stateSpec._initialState :undefined;
		this._managedType = stateSpec ?stateSpec._managedType :undefined;
		this._properties = stateSpec ?stateSpec._properties :{};
		this._shadowClass = stateSpec ?stateSpec._shadowClass :null;

		// readonly is different than other instance variables as readonly state cascades down
		// to properties where not explicitly set to true or false
		this._readonly = stateSpec && stateSpec._readonly;
	}

	/*
		Convenience class method to avoid using 'new StateType(...)' making chaining on the
		newly created StateType easier to read.
	*/
	static create(PropertyClass) {
		return new StateType(PropertyClass);
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

		Returns:
			new StateType instance for the PropertyClass. The value will be a clone of the
			PropertyClass.stateSpec if defined, otherwise equals StateType.create(PropertyClass)
	*/
	static defineType(PropertyClass, specCallback) {
		assert( a => a.not(PropertyClass.hasOwnProperty("type"), `'type' variable already defined`) );

		if (PropertyClass.hasOwnProperty("type")) { return }

		Object.defineProperty(PropertyClass, "type", {
				get: () => {
						const stateType = new StateType(PropertyClass);

						if (specCallback) {
							specCallback(stateType);
						}

						return stateType;
					}
			});
	}

	static from(prop) {
		const ctor = prop.constructor;

		/*
			Get the prototype of prop. two cases
				1) prop is Property instance - proto will be its prototype
				2) prop is actually a prototype - proto will then be the parent prototype
		*/
		const proto = Object.getPrototypeOf(prop);

		return ctor.stateSpec ||
			ctor.type ||
			StateType.from(ctor === proto.constructor ?Object.getPrototypeOf(proto) :proto);
	}

	static implementationClassForProperty(property, defaultClass=ShadowImpl) {
		var proto = Object.getPrototypeOf(property);
		var stateSpec = proto.constructor.stateSpec;

		if (stateSpec && stateSpec._implementationClass) {
			return stateSpec._implementationClass;
		} else {
			return defaultClass;
		}
	}

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
		Configures
	*/
	configureShader(shader) {
		shader.setAutoshadow(this._autoshadow);

		this._setupShader(shader);
	}

	createProperty() {
		return new this._PropertyClass(this);
	}

	default(state) {
		this._defaults = state;

		return this;
	}

	elementType(type) {
		this._elementType = type;

		return this;
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

	implementationClass(cls) {
		this._implementationClass = cls;

		return this;
	}

	initialState(state) {
		this._initialState = state;

		return this;
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
			state= defaults((arrayType ?[] :{}), state, defaultState);
		}

		return state;
	}

	isComplex() {
		return Object.keys(this._properties).length || this._managedType || this._elementType;
	}

	managedType(type) {
		this._managedType = type;

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

	shader(property) {
		const Shader = require("./Shader").default;
		const shader = new Shader(property);

		this._setupShader(shader);

		return shader;
	}

	shadowClass(cls) {
		this._shadowClass = cls;

		return this;
	}

	shadowClassForProperty(defaultClass=Shadow) {
		if (this._shadowClass) {
			return this._shadowClass;
		} else {
			return defaultClass;
		}
	}

	typeName(name) {
		this._PropertyClass.__fluxTypeName__ = name;

		return this;
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
	const KeyedProperty = require("./KeyedProperty").default;
	const ObjectProperty = require("./ObjectProperty").default;
	const Property = require("./Property").default;

	return KeyedProperty === obj || KeyedProperty.isPrototypeOf(obj) || ObjectProperty === obj || ObjectProperty.isPrototypeOf(obj) ||
		(Property.isPrototypeOf(obj) && obj.supportsKeyedChildProperties && obj.supportsKeyedChildProperties());
}
