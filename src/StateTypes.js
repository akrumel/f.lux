import defaults from "lodash.defaults";

import ArrayProperty from "./ArrayProperty";
import IndexedProperty from "./IndexedProperty";
import KeyedProperty from "./KeyedProperty";
import MapProperty from "./MapProperty";
import PropertyFactoryShader from "./PropertyFactoryShader";
import PrimitiveProperty from "./PrimitiveProperty";
import Shader from "./Shader";
import CollectionProperty from "./collection/CollectionProperty";

import {
	assert,
	isObject
} from "akutils";


/*
	Todo:
		- add managed property type support to factory shader
		- attach shader to constructor so shared. Change will require passing property into each call
		  so may not be worth effort. Would need to get rid of KeyedProperty.addProperty() methods.
*/


export class StateType {
	constructor(PropertyClass) {
		this._PropertyClass = PropertyClass;
		this._properties = { };
		this._elementType = null;

		// setup default values
		this._autoshadow = true;
		this._readonly = false;
		this._defaults = undefined;
		this._initialState = undefined;
	}

	static computeInitialState(property, state) {
		var proto = Object.getPrototypeOf(property);
		var stateSpec = proto.constructor.stateSpec;
		var propType, propState;

		if (!stateSpec) { return state; }

		if (state === undefined) {
			state = stateSpec._initialState;
		}

		if (!isObject(state)) { return state; }

		var propSpecs = stateSpec._properties || stateSpec;

		for (let name in propSpecs) {
			propType = propSpecs[name];
			propState = state[name];

			state[name] = propState===undefined ?propType._initialState :propState;
		}

		return state;
	}

	static initialStateWithDefaults(property, state) {
		var proto = Object.getPrototypeOf(property);
		var stateSpec = proto.constructor.stateSpec;
		var propType, propState;

		if (!stateSpec || !isObject(state)) { return state; }

		var propSpecs = stateSpec._properties || stateSpec;

		if (isObject(stateSpec._defaults)) {
			state = defaults({}, state, stateSpec._defaults);
		}

		for (let name in propSpecs) {
			propType = propSpecs[name];

			if (propType && propType._defaults !== undefined) {
				state[name] = defaults({}, state[name], propType._defaults);
			}
		}

		return state;
	}

	static shaderFromSpec(property, stateSpec) {
		const shader = new Shader(property, property.autoShadow);
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

	/*
		Configures
	*/
	configureShader(shader) {
		shader.setAutoshadow(this._autoshadow);

		this._setupShader(shader);
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
				this._readonly || parentProperty.readonly,
				this._automount);

		this._setupShader(shader);

		return shader;
	}

	shader(property) {
		const shader = new Shader(property, property.autoShadow);

		this._setupShader(shader);

		return shader;
	}

	addProperty(name, type) {
		assert( a => {
				a.is(isKeyedPrototype(this._PropertyClass),
					"PropertyClass must be a subclass of KeyedProperty")
			});

		this._properties[name] = type;
	}

	get autoshadow() {
		this._autoshadow = true;

		return this;
	}

	get autoshadowOff() {
		this._autoshadow = false;

		return this
	}

	defaults(state) {
		this._defaults = state;

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
				a.is(isKeyedPrototype(this._PropertyClass), "PropertyClass must be a subclass of KeyedProperty")
			});

		for (let name in propTypes) {
			this.addProperty(name, propTypes[name]);
		}

		return this;
	}

	get readonly() {
		this._readonly = true;

		return this;
	}

	get readonlyOff() {
		this._readonly = false;

		return this;
	}

	setElementType(elementType) {
		assert( a => a.is(isIndexedPrototype(this._PropertyClass), "PropertyClass must be a subclass of IndexedProperty") );

		this._elementType = elementType;

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


function isIndexedPrototype(obj) {
	return IndexedProperty === obj || IndexedProperty.isPrototypeOf(obj);
}

function isKeyedPrototype(obj) {
	return KeyedProperty === obj || KeyedProperty.isPrototypeOf(obj);
}


export default {
	get Primitive() {
		return new StateType(PrimitiveProperty);
	},

	get Array() {
		const type = new StateType(ArrayProperty);

		return type;
	},

	arrayOf(elementStateType) {
		const type = new StateType(ArrayProperty);

		type.setElementType(elementStateType);

		return type;
	},

	get Indexed() {
		const type = new StateType(IndexedProperty);

		return type;
	},

	indexedOf(elementStateType) {
		const type = new StateType(IndexedProperty);

		type.setElementType(elementStateType);

		return type;
	},


// CollectionProperty needs refactoring to support
	// collectionOf(elementStateType) {
	// 	const type = new StateType(CollectionProperty);

	// 	// will call the setElementType() method after property created - will need to add
	// 	// functionality to the factory shader
	// 	type.setManagedPropertyType(elementStateType);

	// 	return type;
	// },

	keyed(defn={}) {
		const type = new StateType(KeyedProperty);
		var propType;

		for (let key in defn) {
			propType = defn[key];

			type.addProperty(key, defn[key]);
		}

		return type;
	},

	map(defn={}) {
		const type = new StateType(MapProperty);
		var propType;

		for (let key in defn) {
			propType = defn[key];

			type.addProperty(key, defn[key]);
		}

		return type;
	},

	mapOf(elementStateType) {
		const type = new StateType(MapProperty);

		type.setElementType(elementStateType);

		return type;
	},

	property(PropertyClass) {
		if (PropertyClass.stateSpec) {
			return PropertyClass.stateSpec;
		}

		return new StateType(PropertyClass);
	},
}