
import Shadow from "./Shadow";

const _impl = Symbol('impl');

export default class PrimitiveShadow {
	constructor(impl) {
		this[_impl] = impl;
	}

	_() {
		return this;
	}

	__() {
		return this[_impl];
	}

	$() {
		return this[_impl].access;
	}

	$$() {
		return this[_impl].property;
	}

	toJSON() {
		return this[_impl].state;
	}

	toString() {
		return JSON.stringify(this);
	}

	valueOf() {
		return this[_impl].state;
	}
}