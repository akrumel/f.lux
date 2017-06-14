import {
	iteratorFor,
	iterateOver,
} from "akutils";
import Symbol from "es6-symbol";

import Shadow from "./Shadow";


/**
	Default shadow api for the `MapProperty`. Exposes the {@link Map} interface.

	@see {@link MapProperty}
*/
export default class MapShadow extends Shadow {
	constructor(impl) {
		super(impl)
	}

	//------------------------------------------------------------------------------------------------------
	// Select Map methods (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
	//------------------------------------------------------------------------------------------------------

	get size() {
		return this.__().size();
	}

	clear() {
		this.__().clear();
	}

	delete(key) {
		return this.__().delete(key);
	}

	entries() {
		return iterateOver(this.__().keys(), key => [ key, this.get(key) ] );
	}

	get(key) {
		const childImpl = this.__().get(key);

		return childImpl && childImpl.shadow();
	}

	has(key) {
		return this.__().has(key);
	}

	keys() {
		return iteratorFor(this.__().keys());
	}

	keysArray() {
		return this.__().keys();
	}

	set(key, value) {
		return this.__().set(key, value);
	}

	values() {
		return iterateOver(this.__().keys(), key => this.get(key));
	}

	valuesArray() {
		return this.__().values().map( v => v.shadow() )
	}

	[Symbol.iterator]() { return this.entries() }
}