import has from "lodash.has";
import sortBy from "lodash.sortby";

import Shadow from "./Shadow";


const _cache = Symbol("_cache");
const _valuesArray = Symbol('_valuesArray');


/**
	Default shadow api for the `IndexedProperty`. Exposes the non-mutating methods of the
	{@link Array} interface.

	@see {@link IndexedProperty}
*/
export default class IndexedShadow extends Shadow {
	constructor(impl) {
		super(impl);

		this[_cache] = {};
	}

	get length() {
		return this.__().length;
	}

	//------------------------------------------------------------------------------------------------------
	//	Read-only array methods
	//------------------------------------------------------------------------------------------------------

	/*
		Alias for valuesArray().
	*/
	all() {
		return this.valuesArray();
	}

	concat(...values) {
		return this.valuesArray().concat(...values);
	}

	every(pred, context) {
		for (let i=0, len=this.length; i<len; i++) {
			if (!pred.call(context, this[i], i, this)) {
				return false;
			}
		}

		return true;
	}

	filter(callback, context) {
		const acc = [];

		for (let i=0, len=this.length; i<len; i++) {
			if (callback.call(context, this[i], i, this)) {
				acc.push(this[i]);
			}
		}

		return acc;
	}

	find(pred, context) {
		for (let i=0, len=this.length; i<len; i++) {
			if (pred.call(context, this[i], i, this)) {
				return this[i];
			}
		}
	}

	findIndex(pred, context) {
		for (let i=0, len=this.length; i<len; i++) {
			if (pred.call(context, this[i], i, this)) {
				return i;
			}
		}

		return -1;
	}

	forEach(callback, context) {
		for (let i=0, len=this.length; i<len; i++) {
			callback.call(context, this[i], i, this);
		}
	}

	groupBy(callback, context) {
		var result = { };

		for (let i=0, len=this.length; i<len; i++) {
			const prop = this[i];
			const key = callback.call(context, prop);

			if (has(result, key)) {
				result[key].push(prop);
			} else {
				result[key] = [ prop ];
			}
		}

		return result;
	}

	includes(searchElement, fromIndex=0) {
		return this.indexOf(searchElement, fromIndex) != -1;
	}

	indexOf(value, fromIndex=0) {
		const fromIdx = Math.min(fromIndex, this.length);

		for (let i=fromIdx, len=this.length; i<len; i++) {
			if (this[i] === value) {
				return i;
			}
		}

		return -1;
	}

	join(separator=',') {
		return this.__().state().join(separator);
	}

	lastIndexOf(value, fromIndex=this.length-1) {
		if (!this.length) { return -1; }

		for (let i=Math.min(fromIndex, this.length-1); i>=0; i--) {
			if (this[i] === value) {
				return i;
			}
		}

		return -1;
	}

	map(callback, context) {
		const acc = [];

		for (let i=0, len=this.length; i<len; i++) {
			acc.push(callback.call(context, this[i], i, this));
		}

		return acc;
	}

	reduce(callback, acc, context) {
		for (let i=0, len=this.length; i<len; i++) {
			acc = callback.call(context, acc, this[i], i, this);
		}

		return acc;
	}

	some(pred, context) {
		for (let i=0, len=this.length; i<len; i++) {
			if (pred.call(context, this[i], i, this)) {
				return true;
			}
		}

		return false;
	}

	sort(callback) {
		const values = this.valuesArray();

		return values.sort(callback);
	}

	sortBy(...iteratee) {
		const values = this.valuesArray();

		return sortBy.apply(null, [values, ...iteratee]);
	}

	/*
		The values() method returns a new Array Iterator object that contains the values for each index in the array.
	*/
	values() {
		var i = 0;
		const length = this.length;
		const next = () => i<length ?{ value: this[i++], done: false } :{ done: true };

		return {
			next: next,
			[Symbol.iterator]() { return { next: next } }
		}
	}

	valuesArray() {
		if (!this[_cache][_valuesArray]) {
			var values = [];

			for (let i=0, len=this.length; i<len; i++) {
				values.push(this[i]);
			}

			this[_cache][_valuesArray] = values;
		}

		return this[_cache][_valuesArray];
	}

	[Symbol.iterator]() { return this.values() }
}