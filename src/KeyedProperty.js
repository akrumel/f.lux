import toPairs from "lodash.topairs";
import has from "lodash.has";

import KeyedShadowImpl from "./KeyedShadowImpl";
import Property from "./Property";
import PropertyFactoryShader from "./PropertyFactoryShader";

import assert from "./utils/assert";
import doneIterator from "./utils/doneIterator";
import iteratorFor from "./utils/iteratorFor";
import iterateOver from "./utils/iterateOver";


/*
*/
export default class KeyedProperty extends Property {
	constructor(initialState={}, autoShadow, readonly) {
		super(initialState, autoShadow, readonly);
	}

	addProperty(name, property, automount) {
		property.setParent(this);

		return this.addPropertyShader(name, property.shader(), property.getInitialState(), automount);
	}

	addPropertyClass(name, propClass, initialState, autoShadow, readonly, automount) {
		const shader = new PropertyFactoryShader(propClass, this, initialState, autoShadow, readonly, automount);

		return this.addPropertyShader(name, shader, initialState);
	}

	addPropertyShader(name, shader, initialState, automount) {
		// initial state has two sources: parameter and the shader
		initialState = initialState !== undefined
				?initialState
				:shader.initialState ?shader.initialState :this.initialState && this.initialState[name];

		this.shader().add(name, shader, automount);

		if (this.isActive()) {
			if (initialState !== undefined) {
				this.set(name, initialState);
			}

			this.refresh();
		} else {
			this.initialState[name] = initialState;
		}

		// return shader so can be further customized
		return shader;
	}

	removeProperty(name) {
		this.shader().remove(name);
		this.delete(name);
	}


	//------------------------------------------------------------------------------------------------------
	// State lifecycle methods
	//------------------------------------------------------------------------------------------------------

	/*
		Gets the initial state for a property at the beginning of the property mounting process. This
		implementation merges the 'initialState' parameter passed to the constructor or set using the
		initialState() method with the state passed in from the existing store state. The store's state
		property values take precedence.

		Parameters:
			state - the store's property state at the time of mounting.

		Returns - merged state with the state parameter taking precedence if the initial state is set
			otherwise returns the state parameter. This base implementation simply returns the state
			parameter
	*/
	getInitialState(state) {
		const { StateType } = require("./StateTypes");
		var initialState = state;

		if (this.initialState) {
			// state take precedence
			initialState = { ...this.initialState, ...state };
		}

		return StateType.initialStateWithDefaults(this, initialState);
	}


	//------------------------------------------------------------------------------------------------------
	// Subclasses may want to override thise methods
	//------------------------------------------------------------------------------------------------------

	implementationClass() {
		return KeyedShadowImpl;
	}


	//------------------------------------------------------------------------------------------------------
	// Map and other useful data structure functions
	//------------------------------------------------------------------------------------------------------

	get size() {
		return this.__.size;
	}

	clear() {
		if (this.isActive()) {
			this.__.clear();
		}
	}

	delete(key) {
		if (this.isActive()) {
			const value = this._[key];

			// need to perform action even if value is undefined because could be a queued action
			// to add it.
			this.__.delete(key);

			return value;
		}
	}

	entries() {
		if (!this.isActive()) { return doneIterator; }

		return iterateOver(this.keysArray(), key => [key, this.get(key)] );
	}

	get(key) {
		if (this.isActive()) {
			return this._[key];
		}
	}

	has(key) {
		if (this.isActive()) {
			return has(this._, key);
		}
	}

	keysArray() {
		if (!this.isActive()) { return doneIterator }

		return this.__.keys();
	}

	keys() {
		if (!this.isActive()) { return doneIterator; }

		return iteratorFor(this.__.keys());
	}

	set(key, value) {
		if (this.isActive()) {
			this.__.set(key, value);
		}
	}

	valuesArray() {
		if (!this.isActive()) { return doneIterator; }

		const keys = this.keysArray();
		const values = [];

		for (let i=0, len=keys.length; i<len; i++) {
			values.push( this[keys[i]] );
		}

		return values;
	}

	values() {
		if (!this.isActive()) { return doneIterator; }

		return iterateOver(this.keysArray(), key => this.get(key));
	}

	[Symbol.iterator]() { return this.entries() }
}


//------------------------------------------------------------------------------------------------------
//	Constants and helpers
//------------------------------------------------------------------------------------------------------
