import Symbol from "es6-symbol";
import has from "lodash.has";
import {
	assert,
	doneIterator,
	iteratorFor,
	iterateOver,
} from "akutils";


/**
	API implementation for properties that support keyed access to child properties.

	@see {@link MapProperty}
	@see {@link ObjectProperty}
*/
export default class KeyedApi {
	constructor(property) {
		this._property = property;
	}

	impl() {
		return this._property.__();
	}

	isActive() {
		return this._property.isActive();
	}

	shadow() {
		return this._property._();
	}

	addProperty(name, property, automount) {
		property.setParent(this._property);

		return this.addPropertyShader(name, property.shader(), property.getInitialState(), automount);
	}

	addPropertyType(name, stateType) {
		return this.addPropertyShader(name, stateType.factory(this._property), stateType._initialState);
	}

	addPropertyShader(name, shader, initialState, automount) {
		const property = this._property;
		const propInitialState = property.initialState();

		// initial state has two sources: parameter and the shader
		const iState = initialState !== undefined
				?initialState
				:shader.initialState ?shader.initialState :propInitialState && propInitialState[name];

		property.shader().add(name, shader, automount);

		if (this.isActive()) {
			if (iState !== undefined) {
				this.set(name, iState);
			}

			property.touch();
		} else if (propInitialState) {
			propInitialState[name] = iState;
		}

		// return shader so can be further customized
		return shader;
	}

	removeProperty(name) {
		this._property.shader().remove(name);
		this.delete(name);
	}


	//------------------------------------------------------------------------------------------------------
	// Map and other useful data structure functions
	//------------------------------------------------------------------------------------------------------

	clear() {
		if (this.isActive()) {
			this.impl().clear();
		}
	}

	delete(key) {
		if (this.isActive()) {
			const value = this.shadow()[key];

			// need to perform action even if value is undefined because could be a queued action
			// to add it.
			this.impl().delete(key);

			return value;
		}
	}

	entries() {
		if (!this.isActive()) { return doneIterator; }

		return iterateOver(this.keysArray(), key => [key, this.get(key)] );
	}

	filter(callback, context) {
		const keys = this.keysArray();
		const shadow = this.shadow();
		const acc = [];
		var key, value;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			value = shadow[key];

			if (callback.call(context, value, key, shadow)) {
				acc.push(value);
			}
		}

		return acc;
	}

	get(key) {
		if (this.isActive()) {
			return this.shadow()[key];
		}
	}

	has(key) {
		if (this.isActive()) {
			return has(this.shadow(), key);
		}
	}

	keys() {
		if (!this.isActive()) { return doneIterator; }

		return iteratorFor(this.keysArray());
	}

	keysArray() {
		if (!this.isActive()) { return [] }

		// use Object.keys() so do not get non-enumerable properties
		return Object.keys(this.shadow());
	}

	set(key, value) {
		if (this.isActive()) {
			this.impl().set(key, value);
		}
	}

	/*
		Converting map size property to a function in keeping with current design philosophy of minimizing
		internal object properties in favor of methods.
	*/
	size() {
		return this.impl().size();
	}

	valuesArray() {
		if (!this.isActive()) { return []; }

		const shadow = this.shadow()
		const keys = this.keysArray();
		const values = [];

		for (let i=0, len=keys.length; i<len; i++) {
			values.push(shadow[keys[i]]);
		}

		return values;
	}

	values() {
		if (!this.isActive()) { return doneIterator; }

		return iterateOver(this.keysArray(), key => this.get(key));
	}

	[Symbol.iterator]() { return this.entries() }
}
