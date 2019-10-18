import {
	assert,
	doneIterator,
	iteratorFor,
	iterateOver,
} from "akutils";
import Symbol from "es6-symbol";

import ObjectProperty from "./ObjectProperty";
import Shadow from "./Shadow";
import StateType from "./StateType";
import TransientProperty from "./TransientProperty";

import appDebug, { TransientKey as DebugKey } from "./debug";
const debug = appDebug(DebugKey);


/**
	The shadow api for the {@link Store#transients} property. This api implements a superset of the
	[Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) class.
*/
export class TransientsShadow extends Shadow {
	/*
		Gets the number of transient objects.
	*/
	get size() {
		return this.__().size();
	}

	/**
		Removes all transient objects.
	*/
	clear() {
		this.__().clear();
	}

	/**
		Removes the speecified transient object from {@link Store#transients}.

		@param id - the transient key
	*/
	delete(id) {
		this.$$()._keyed.removeProperty(id);
	}

	/**
		Gets an [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
		object that contains the `[id, {@link TransientShadow}]` pairs for each transient property in the
		{@link Store#transients} property.
	*/
	entries() {
		return iterateOver(this.__().keys(), key => [ key, this[key] ] );
	}

	get(id) {
		if (this.__().has(id) && this[id]) {
			return this[id].$$();
		} else {
			return this.$$().getFromCache(id);
		}
	}

	/**
		Gets if the {@link Store#transients} object contains a transient object.
	*/
	has(id) {
		return this.__().has(id) || this.$$().isCached(id);
	}

	/**
		Gets an [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
		object that contains the transient keys.
	*/
	keys() {
		return iteratorFor(this.__().keys());
	}

	/**
		Adds or updates a {@link TransientProperty} with a specified id. The returned {@link TransientProperty#link}
		method must be called immediately following this method invocation or the property may be swept from the
		transient list after the next store update.

		@param id - the transient key
		@param {Property} property - a `Property` instance to track in the transients property.

		@return the {@link TransientProperty} containing the `property` instance passed into the
			method.
	*/
	set(id, property) {
		assert( a => a.is(id, "id must be specifeid for setting a transient property") );

		var trans = new TransientProperty(id, property);

		this.$$()._keyed.addProperty(id, trans);
		this.$$().addToCache(id, trans);

		return trans;
	}

	/**
		Invoked by {@link Store#_exec} to remove unlocked transient objects.
	*/
	sweep() {
		const property = this.$$();
		const keys = property._keyed.keysArray();

		for (let i=0, t; t=this[keys[i]]; i++) {
			if (!t.isLocked()) {
				this.delete(keys[i]);
			}
		}
	}

	/**
		Gets an [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
		object that contains the {@link TransientShadow} instances.
	*/
	values() {
		return iterateOver(this.__().keys(), key => this[key]);
	}

	[Symbol.iterator]() { return this.entries() }
}


/**
	The property representing {@link Store#transients}

	@see {@link TransientsShadow}
*/
export default class TransientsProperty extends ObjectProperty {
	constructor(type) {
		super(type);

		this.setShadowClass(TransientsShadow);
		this.cache = {};
	}

	propertyDidUpdate() {
		this.cache = {};
	}

	addToCache(id, transProp) {
		this.cache[id] = transProp;
	}

	getFromCache(id) {
		return this.cache[id];
	}

	isCached(id) {
		return !!this.cache[id];
	}
}


StateType.defineType(TransientsProperty, spec => {
	spec.initialState({})
		.autoshadowOff
		.readonly
		.typeName("TransientsProperty");
});


