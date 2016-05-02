import has from "lodash.has";

import Shadow from "./Shadow";

export default class ArrayShadow extends Shadow {
	get length() {
		return this.__.length; 
	}


	//------------------------------------------------------------------------------------------------------
	//	Read-only array methods
	//------------------------------------------------------------------------------------------------------
	
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
				acc.push(v);
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
		return this.__.state.join(separator);
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

	[Symbol.iterator]() { return this.values() }
}