
export default class Shadow {
	constructor(impl) {
		// these properties are all NOT enumerable so calls like Object.keys() work correctly
		Object.defineProperty(this, '$', { enumerable: false, get: () => impl.access });
		Object.defineProperty(this, '__', { enumerable: false, get: () => impl });
		Object.defineProperty(this, '$$', { enumerable: false, get: () => impl.property });

		// for @state Property mappings - just this object
		Object.defineProperty(this, '_', { enumerable: false, value: this });

		// easy debug access to the raw state
		Object.defineProperty(this, '__state__', { enumerable: false, value: impl.state });
	}

	toString() {
		return JSON.stringify(this);
	}

	toJSON() {
		return this.__.state;
	}
}

