const _impl = Symbol('impl');


export default class Shadow {
	constructor(impl) {
		this[_impl] = impl;

		// easy debug access to the raw state
		if (process.env.NODE_ENV !== 'production') {
			Object.defineProperty(this, '__state__', { enumerable: false, value: impl.state() });
		}
	}

	_() {
		return this;
	}

	__() {
		return this[_impl];
	}

	$() {
		return this[_impl].access();
	}

	$$() {
		return this[_impl].property();
	}

	toString() {
		return JSON.stringify(this);
	}

	toJSON() {
		return this[_impl].state();
	}
}

