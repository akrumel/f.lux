const _impl = Symbol('impl');


export default class Shadow {
	constructor(impl) {
		this[_impl] = impl;

		// easy debug access to the raw state
		if (process.env.NODE_ENV !== 'production') {
			Object.defineProperty(this, '__state__', { enumerable: false, value: impl.state() });
		}

		// these properties are all NOT enumerable so calls like Object.keys() work correctly
		Object.defineProperty(this, '$', { enumerable: false, get: () => impl.access() });
		Object.defineProperty(this, '$$', { enumerable: false, get: () => impl.property });

		// for @state Property mappings - just this object
		Object.defineProperty(this, '_', { enumerable: false, value: this });
	}

	__() {
		return this[_impl];
	}

	toString() {
		return JSON.stringify(this);
	}

	toJSON() {
		return this.__().state();
	}
}

