import Access from "../Access";


export default class ShadowModelAccess extends Access {
	constructor(modelProperty, impl) {
		super(impl);

		Object.defineProperty(this, '$$', { enumerable: true, value: modelProperty })
	}

	/*
		Returns a ShadowModelAccess so any subproperties will have a ShadowModelAccess accessor.
	*/
	create$ForChild(childImpl) {
		return new ShadowModelAccess(this.$$, childImpl);
	}

	get collection() {
		return this.$$.collection.state;
	}

	get dirty() {
		return this.$$.dirty;
	}

	get id() {
		return this.$$.id;
	}

	destroy() {
		return this.$$.destroy();
	}

	isNew() { 
		return this.$$.isNew();
	}

	save() {
		return this.$$.save();
	}
}