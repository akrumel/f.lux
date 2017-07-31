import Symbol from "es6-symbol";

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

	/*
		Override parent version so can reset dirty flag in model
	*/
	resetToCheckpoint() {
		this.$$().resetDataToCheckpoint();
	}

	$$() {
		return this[_modelProperty];
	}

	cid() {
		return this.$$().cid;
	}

	collection() {
		return this.$$().collection._();
	}

	destroy() {
		return this.$$().destroy();
	}

	id() {
		return this.$$().id;
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
		return this.$$().remove();
	}

	save() {
		return this.$$().save();
	}
}