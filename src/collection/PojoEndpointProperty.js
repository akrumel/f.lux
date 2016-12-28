import uuid from "uuid";
import cloneDeep from "lodash.clonedeep";
import reduce from "lodash.reduce";

import ObjectProperty from "../ObjectProperty";
import Shadow from "../Shadow";
import StateType from "../StateType";
import Store from "../Store";

import PojoQueryBuilder from "./PojoQueryBuilder";

/*

*/
export default class PojoEndpointProperty extends ObjectProperty {
	constructor(pojo={}) {
		super(PojoEndpointProperty.type);

		this.setShadowClass(PojoEndpointShadow);

		this.id = uuid();

		// model objects kept in instance variable instead of state so direct changes (manual) do not
		// cause a store change
		this.models = pojo;
	}
}


StateType.defineType(PojoEndpointProperty, spec => spec.initialState({}) );


class PojoEndpointShadow extends Shadow {
	get id() {
		return this.$$().id;
	}

	get models() {
		return this.$$().models;
	}

	isConnected() {
		return true;
	}

	queryBuilder() {
		return new PojoQueryBuilder();
	}

	doCreate(shadowModel, model) {
		const obj = cloneDeep(model);

		if (!obj.id) {
			obj.id = uuid();
		}

		this.models[obj.id] = obj;

		return Store.resolve(obj);
	}

	doDelete(id) {
		delete this.models[id];

		return Store.resolve(id);
	}

	doFetch(filter) {
		const models = filter
			?filter.on(this.models)
			:Object.values(this.models);

		return Store.resolve(models);
	}

	doFind(id) {
		return Store.resolve(this.models[id]);
	}

	doUpdate(id, shadowModel, changedProps) {
		this.models[id] = changedProps;

		return Store.resolve(changedProps);
	}
}

