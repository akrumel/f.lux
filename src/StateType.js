import { assert, isObject } from "akutils";
import defaults from "lodash.defaults";
import isArray from "lodash.isarray";

import PropertyFactoryShader from "./PropertyFactoryShader";
import Property from "./Property";
import Shader from "./Shader";
import Shadow from "./Shadow";
import ShadowImpl from "./ShadowImpl";



/*
	Todo:
		- add managed property type support to factory shader
*/


export default class StateType {
	constructor(PropertyClass) {
		this._PropertyClass = PropertyClass;
		this._properties = { };
		this._elementType = null;

		// setup default values
		const stateSpec = PropertyClass.stateSpec;

		this._autoshadow = stateSpec ?stateSpec._autoShadow :true;
		this._defaults = stateSpec ?stateSpec._defaults :undefined;
		this._implementationClass = stateSpec ?stateSpec._implementationClass :null;
		this._initialState = stateSpec ?stateSpec._initialState :undefined;
		this._readonly = stateSpec ?stateSpec._readonly :false;
		this._shadowClass = stateSpec ?stateSpec._shadowClass :null;
	}

	static computeInitialState(property, ctorInitState) {
		var proto = Object.getPrototypeOf(property);
		var stateSpec = proto.constructor.stateSpec;
		var propType, propState, state;

		if (!stateSpec) { return ctorInitState; }

		// give state spec initial state priority since explicitly set
		if (stateSpec._initialState !== undefined) {
			state = stateSpec._initialState;
		} else {
			state = ctorInitState
		}
		// code from before making state spec priority (keep for a bit 11/2/16)
		// if (state === undefined) {
		// 	state = stateSpec._initialState;
		// }

		if (!isObject(state)) { return state; }

		var propSpecs = stateSpec._properties || stateSpec;

		for (let name in propSpecs) {
			propType = propSpecs[name];
			propState = state[name];

			state[name] = propState===undefined ?propType._initialState :propState;
		}

		return state;
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
	static defineType(PropertyClass) {
		assert( a => a.not(PropertyClass.hasOwnProperty("type"), `'type' variable already defined`) );

		if (PropertyClass.hasOwnProperty("type")) { return }

		Object.defineProperty(PropertyClass, "type", {
				get: () => new StateType(PropertyClass)
			});
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

	static initialStateWithDefaults(property, state) {
		var proto = Object.getPrototypeOf(property);
		var stateSpec = proto.constructor.stateSpec;
		var arrayType = isArray(state);
		var defaultState, propType, propState;

		if (!stateSpec || (!isObject(state) && !arrayType)) { return state; }

		var propSpecs = stateSpec._properties || stateSpec;

		if (isObject(stateSpec._defaults)) {
			state = defaults( (arrayType ?[] :{}), state, stateSpec._defaults);
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

	static shaderFromSpec(property, stateSpec) {
		const shader = new Shader(property, property.autoShadow());
		var eltType;

		for (let name in stateSpec) {
			eltType = stateSpec[name];

			if (eltType.isComplex()) {
				// complex definition so need to pass entire definition to shader so can handle recusively
				shader.addStateType(name, eltType);
			} else {
				shader.addPropertyClass(
						name,
						eltType._PropertyClass,
						eltType._initialState,
						eltType._autoshadow,
						eltType._readonly);
			}
		}

		return shader;
	}

	static shadowClassForProperty(property, defaultClass=Shadow) {
		var proto = Object.getPrototypeOf(property);
		var stateSpec = proto.constructor.stateSpec;

		if (stateSpec && stateSpec._shadowClass) {
			return stateSpec._shadowClass;
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

	/*
		Configures
	*/
	configureShader(shader) {
		shader.setAutoshadow(this._autoshadow);

		this._setupShader(shader);
	}

	createProperty() {
		return new this._PropertyClass(this._initialState, this._autoshadow, this._readonly);
	}

	default(state) {
		this._defaults = state;

		return this;
	}

	/*
		Returns a PropertyFactoryShader that will create property instances as configured by this StateType.
	*/
	factory(parentProperty) {
		const shader = new PropertyFactoryShader(
				this._PropertyClass,
				parentProperty,
				this._initialState,
				this._autoshadow,
				this._readonly || parentProperty.isReadonly(),
				this._automount);

		this._setupShader(shader);

		return shader;
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

	isComplex() {
		return Object.keys(this._properties).length || this._managedPropertyType || this._elementType;
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

	setElementClass(elementClass) {
		this._elementType = elementClass;

		return this;
	}

	shader(property) {
		const shader = new Shader(property, property.autoShadow());

		this._setupShader(shader);

		return shader;
	}

	shadowClass(cls) {
		this._shadowClass = cls;

		return this;
	}

	typeName(name) {
		this._PropertyClass.__fluxTypeName__ = name;

		return this;
	}

	_setupShader(shader) {
		if (this._elementType) {
			let eltType = this._elementType;

			if (eltType.isComplex && eltType.isComplex()) {
				shader.setElementStateType(eltType);
			} else if (eltType.PropertyClass) {
				shader.setElementClass(eltType.PropertyClass, eltType.defaults, eltType.autoShadow, eltType.readonly);
			} else {
				shader.setElementClass(eltType);
			}
		} else if (this._managedPropertyType) {
			// will call the setElementType() method after property created - will need to add
			// functionality to the factory shader

// ADD setManagedPropertyType() TO FACTORY - requires changes to Collection first

			shader.setManagedPropertyType(this._managedPropertyType);
		} else {
			let eltType;

			for (let name in this._properties) {
				eltType = this._properties[name];

				if (eltType.isComplex()) {
					// complex definition so need to pass entire definition to shader so can handle recusively
					shader.addStateType(name, eltType);
				} else {
					shader.addPropertyClass(name, eltType._PropertyClass, eltType._initialState, eltType._autoshadow, eltType._readonly);
				}
			}
		}
	}
}


function isKeyedPrototype(obj) {
	const KeyedProperty = require("./KeyedProperty").default;
	const ObjectProperty = require("./ObjectProperty").default;

	return KeyedProperty === obj || KeyedProperty.isPrototypeOf(obj) || ObjectProperty === obj || ObjectProperty.isPrototypeOf(obj) ||
		(Property.isPrototypeOf(obj) && obj.supportsKeyedChildProperties && obj.supportsKeyedChildProperties());
}
