import has from "lodash.has";
import sortBy from "lodash.sortby";
import { iteratorFor } from "akutils";

import Shadow from "../Shadow";

import { DEFAULTS_OPTION, REPLACE_OPTION } from "./CollectionOptions";


const _valuesArray = Symbol('_valuesArray');
const _keysArray = Symbol('_keysArray');

export default class CollectionShadow extends Shadow {
	constructor(impl) {
		super(impl)
	}

	get endpoint() {
		return this._endpoint;
	}

	get fetching() {
		return this.$$.isFetching();
	}

	get id() {
		return this._endpoint && this._endpoint.id;
	}

	get size() {
		return this._models.size;
	}

	//------------------------------------------------------------------------------------------------------
	// Paging API
	//------------------------------------------------------------------------------------------------------

	get limit() {
		return this._limit;
	}

	get paging() {
		return this.$$.isPaging(this);
	}

	fetchNext(mergeOp=REPLACE_OPTION) {
		return this.$$.fetchNext(mergeOp);
	}

	hasMorePages() {
		return this.$$.hasMorePages(this);
	}

	setLimit(limit) {
		this.$$.setLimit(limit);
	}

	//------------------------------------------------------------------------------------------------------
	// Stable API
	//------------------------------------------------------------------------------------------------------

	/*
		Synchronously adds a new model object to the store. Call model.$.save() to persist the newly added
		object.

		Parmaeters:
			state - the object model to add to the collection
			merge - boolean declaring whether this state should be merged over an existing model with
				the same ID. False means a current model will be replaced with the new model value.

		Returns the object's ID. And ID is assigned if the 'id' parameter was not set and it could not
			be found in the 'state' parameter.
	*/
	addModel(state, mergeOp=DEFAULTS_OPTION) {
		return this.$$.addModel(state, mergeOp);
	}

	/*
		Bulk adds multiple models. Models must have an ID as it is assumed they have been previously
		saved.

		Parameters:
			states - array of model values
			merge - boolean declaring whether each state should be merged over an existing model with
				the same ID. False means a current model will be replaced with the new model value.
	*/
	addModels(states, mergeOp=DEFAULTS_OPTION) {
		this.$$.addModels(states, mergeOp);
	}

	clear() {
		this.$$.removeAllModels();
	}

	/*
		Compbines an add and save actions.
	*/
	create(model) {
		return this.$$.create(model);
	}

	destroy(id) {
		return this.$$.destroy(id);
	}

	entries() {
		return this.$$.modelEntries(this);
	}

	every(iteratee, context) {
		const keys = this.keysArray();
		var key, value;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			value = this.get(key);

			if (!iteratee.call(context, value, key, this)) {
				return false;
			}
		}

		return true;
	}

	fetch(filter=null, mergeOp=REPLACE_OPTION) {
		return this.$$.fetch(filter, mergeOp);
	}

	filter(iteratee, context) {
		const keys = this.keysArray();
		const acc = [];
		var key, value;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			value = this.get(key);

			if (iteratee.call(context, value, key, this)) {
				acc.push(value);
			}
		}

		return acc;
	}

	find(id) {
		return this.$$.find(id);
	}

	findModel(iteratee, context) {
		const keys = this.keysArray();
		var key, value;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			value = this.get(key);

			if (iteratee.call(context, value, key, this)) {
				return value;
			}
		}

		return undefined;
	}

	forEach(callback, context) {
		const keys = this.keysArray();
		var key;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];

			callback.call(context, this.get(key), key, this);
		}
	}

	get(id) {
		return this.$$.getModel(id, this);
	}

	groupBy(callback, context) {
		const keys = this.keysArray();
		const result = { };
		var key, value, groupId;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			value = this.get(key);
			groupId = callback.call(context, value, key, this);

			if (has(result, groupId)) {
				result[groupId].push(value);
			} else {
				result[groupId] = [ value ];
			}
		}
	}

	has(id) {
		return this.$$.hasModel(id, this);
	}

	isConnected() {
		return this.$$.isConnected();
	}

	isNew(id) {
		return this.$$.isNew(id, this);
	}

	keys() {
		return this.$$.modelKeys(this);
	}

	keysArray() {
		if (!this[_keysArray]) {
			this[_keysArray] = this.$$.modelKeysArray(this);
		}

		return this[_keysArray];
	}

	map(iteratee, context) {
		const keys = this.keysArray();
		const acc = [];
		var key;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];

			acc.push(iteratee.call(context, this.get(key), key, this));
		}

		return acc;
	}

	reduce(iteratee, acc, context) {
		const keys = this.keysArray();
		var key, value;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			value = this.get(key);

			acc = iteratee.call(context, acc, value, key, this);
		}

		return acc;
	}

	setEndpoint(endPoint) {
		this.$$.setEndpoint(endPoint);
	}

	setModels(models) {
		this.$$.setModels(models);
	}

	some(iteratee, context) {
		const keys = this.keysArray();
		var key, value;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			value = this.get(key);

			if (iteratee.call(context, value, key, this)) {
				return true;
			}
		}

		return false;
	}

	/*
		Sorts using the same arguments as lodash sortBy (https://lodash.com/docs#sortBy).
	*/
	sortBy(...iteratee) {
		const values = this.valuesArray();

		return sortBy.apply(null, [values, ...iteratee]);
	}

	values() {
		return this.$$.modelValues(this);
	}

	valuesArray() {
		if (!this[_valuesArray]) {
			this[_valuesArray] = this.$$.modelsArray(this);
		}

		return this[_valuesArray];
	}

	[Symbol.iterator]() { return this.$$.modelEntries(this) }
}

