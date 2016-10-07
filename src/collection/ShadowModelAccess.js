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
		return this.$$.collection._;
	}

	get dirty() {
debugger
console.error("Deprecated - use $().isDirty()");

		return this.$$.isDirty();
	}

	get id() {
		return this.$$.id;
	}

	cid() {
		return this.$$.cid;
	}

	destroy() {
		return this.$$.destroy();
	}

	isWaiting() {
		return this.$$.isWaiting();
	}

	isDirty() {
		return this.$$.isDirty();
	}

	isNew() {
		return this.$$.isNew();
	}

	save() {
		return this.$$.save();
	}
}