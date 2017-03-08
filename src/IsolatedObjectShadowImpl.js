import omit from "lodash.omit";
import isEqual from "lodash.isequal";
import isPlainObject from "lodash.isplainobject";

import IsolatedProperty from "./IsolatedProperty";
import ShadowImpl from "./ShadowImpl";
import reshadow from "./reshadow";


const _implsCacheKey = Symbol("implsCacheKey");
const _keysCacheKey = Symbol("keysCacheKey");
const _valuesCacheKey = Symbol("valuesCacheKey");


export default class IsolatedObjectShadowImpl extends ShadowImpl {
	/*
		Removes all subproperties.
	*/
	clear() {
		this.isolated().removeAllFor(this.property());
		this.update( state => ({ name: `clear()`, nextState: state }) );
	}

	/*
		Removes a subproperty from this state property.
	*/
	delete(k) {
		this.isolated().remove(k, this.property());
		this.update( state => ({ name: `delete(${k})`, nextState: state }) );
	}

	/*
		Gets a copy of the implementation objects.

		@return {object} key=name, value=property
	*/
	entries() {
		return this.isolated().entires(this.property());
	}

	extend(sources) {
		const keys = Object.keys(sources);
		var key;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];

			this.set(key, sources[key])
		}
	}

	/*
		Gets the property implementation for a state property.
	*/
	get(k) {
		const isoProp = this.isolated().get(k, this.property());
		const isoShadow = isoProp && isoProp._();

		if (isoProp && isoProp.isActive()) {
			return isoProp._().data.__();
		} else {
			return undefined;
		}
	}

	/*
		Gets if this state property has a subproperty with a specified name.
	*/
	has(k) {
		return !!this.get(k);
	}

	isolated() {
		return this.store().isolated();
	}

	/*
		Gets the keys of all managed subproperties. Returns an array.
	*/
	keys() {
		const cache = this.cache();

		if (!cache[_keysCacheKey]) {
			const isoProps =  this.isolated().all(this.property());

			cache[_keysCacheKey] = isoProps.map( p => p.name() );
		}

		return cache[_keysCacheKey];
	}

	/*
		Sets a subproperty value. Replaces current state property if one has an identical name.
	*/
	set(k, v) {
		this.isolated().set(k, v, this.property());
		this.update( state => ({ name: `set(${k})`, nextState: state }) );

		return this;
	}

	size() {
		return this.isolated().count(this.property());
	}

	/*
		Gets subproperty implementation objects. Returns an array.
	*/
	values() {
		const cache = this.cache();

		if (!cache[_valuesCacheKey]) {
			const isoProps =  this.isolated().all(this.property());

			cache[_valuesCacheKey] = isoProps.map( p => p._().data.__() );
		}

		return cache[_valuesCacheKey];
	}


	//------------------------------------------------------------------------------------------------------
	//	Overridden methods
	//------------------------------------------------------------------------------------------------------

	childCount() {
		return this.size();
	}

	children() {
		const cache = this.cache();

		if (!cache[_implsCacheKey]) {
			let isoProps =  this.isolated().all(this.property());

			cache[_implsCacheKey] = isoProps.map( p => p.__() );
		}

		return cache[_implsCacheKey];
	}

	defaults(state) {
		console.warn("defaults() not supported")
	}

	/*
		Maps all child properties onto this property using Object.defineProperty().
	*/
	defineChildProperties(prev, inCtor) {
		const isolated = this.isolated();
		const property = this.property();

		isolated.update(property);

		// get keys after isolated update() since it will alter iso properties
		// explicitly build list based on shader children since this will usually be
		// a much smaller number of items than the number of children
		const shader = this.shader();
		const keys = shader.keys().filter( k => isolated.has(k, property) );

		shader.shadowUndefinedProperties(keys, this, (name, shader) => {
				this.set(name, shader.stateType().computeInitialState());
			}, keys);

		isolated.update(property);
	}


	hasChildren() {
		return !!this.size();
	}

	merge(state) {
		console.warn("merge() not supported")
	}

	onObsolete() {
		this.isolated().removeOwner(this.property());
	}
}