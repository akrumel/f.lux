import {
	iteratorFor,
	iterateOver,
} from "akutils";

import Shadow from "./Shadow";


/*

*/
export default class MapShadow extends Shadow {
	constructor(impl) {
		super(impl)
	}

	//------------------------------------------------------------------------------------------------------
	// Select Map methods (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
	//------------------------------------------------------------------------------------------------------

	get size() {
		return this.__.size();
	}

	clear() {
		this.__.clear();
	}

	delete(key) {
		return this.__.delete(key);
	}

	entries() {
		return iterateOver(this.__.keys(), key => [ key, this[key] ] );
	}

	get(key) {
		return this[key];
	}

	has(key) {
		return this.__.has(key);
	}

	keys() {
		return iteratorFor(this.__.keys());
	}

	set(key, value) {
		return this.__.set(key, value);
	}

	values() {
		return iterateOver(this.__.keys(), key => this[key]);
	}

	[Symbol.iterator]() { return this.entries() }
}