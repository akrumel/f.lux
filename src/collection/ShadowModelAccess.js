import Access from "../Access";


const _modelProperty = Symbol("modelProperty");


export default class ShadowModelAccess extends Access {
	constructor(modelProperty, impl) {
		super(impl);

		this[_modelProperty] = modelProperty;
	}

	/*
		Returns a ShadowModelAccess so any subproperties will have a ShadowModelAccess accessor.
	*/
	create$ForChild(childImpl) {
		return new ShadowModelAccess(this[_modelProperty], childImpl);
	}

	get collection() {
		return this.$$().collection._();
	}

	get id() {
		return this.$$().id;
	}

	$$() {
		return this[_modelProperty];
	}

	cid() {
		return this.$$().cid;
	}

	destroy() {
		return this.$$().destroy();
	}

	isWaiting() {
		return this.$$().isWaiting();
	}

	isDirty() {
		return this.$$().isDirty();
	}

	isNew() {
		return this.$$().isNew();
	}

	remove() {
		return this.$$().remove(this.id);
	}

	save() {
		return this.$$().save();
	}
}