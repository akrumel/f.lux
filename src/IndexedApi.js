

export default class IndexedApi {
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

	get length() {
		if (this.isActive()) {
			return this.impl().length;
		}
	}

	//------------------------------------------------------------------------------------------------------
	//    Select Array methods:
	//          (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
	//------------------------------------------------------------------------------------------------------

	clear() {
		if (this.isActive()) {
			this.impl().clear();
		}
	}

	concat(...values) {
		if (this.isActive()) {
			return this.impl().concat(...values);
		}
	}

	pop() {
		if (this.isActive()) {
			return this.impl().pop();
		}
	}

	push(...values) {
		if (this.isActive()) {
			return this.impl().push(...values);
		}
	}

	remove(idx) {
		if (this.isActive()) {
			return this.impl().remove(idx);
		}
	}

	shift() {
		if (this.isActive()) {
			return this.impl().shift();
		}
	}

	splice(start, deleteCount, ...newItems) {
		if (this.isActive()) {
			return this.impl().splice(start, deleteCount, ...newItems);
		}
	}

	unshift(...values) {
		if (this.isActive()) {
			return this.impl().unshift(...values);
		}
	}
}