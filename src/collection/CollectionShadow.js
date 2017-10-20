import Symbol from "es6-symbol";
import has from "lodash.has";
import sortBy from "lodash.sortby";
import { iteratorFor } from "akutils";

import Shadow from "../Shadow";

import { DEFAULTS_OPTION, MERGE_OPTION, REPLACE_OPTION } from "./CollectionOptions";


const _cache = Symbol("_cache");
const _keysArray = Symbol('_keysArray');
const _valuesArray = Symbol('_valuesArray');


/**
	Shadow api for the `CollectionProperty`.

	## Basic functions

	<ul>
		<li>`add(state, mergeOp)`</li>
		<li>`all()`</li>
		<li>`clear()</li>
		<li>`create(model)`</li>
		<li>`destroy(id)`</li>
		<li>`fetch(filter, mergeOp)`</li>
		<li>`find(id)`</li>
		<li>`get(id)`</li>
		<li>`has(id)`</li>
		<li>`remove(id)`</li>
	</ul>


	## Utility functions

	<ul>
		<li>`entries()`</li>
		<li>`every(iteratee, context)`</li>
		<li>`filter(iteratee, context)`</li>
		<li>`groupBy(callback, context)`</li>
		<li>`keys()`</li>
		<li>`map(iteratee, context)`</li>
		<li>`reduce(iteratee, acc, context)`</li>
		<li>`some(iteratee, context)`</li>
		<li>`sortBy(...iteratee)`</li>
		<li>`values()`</li>
	</ul>

	## Paging function

	<ul>
		<li>`fetchNext()` - gets the next group of models</li>
		<li>`isPaging()` - gets if a paging request is outstanding (only one paging request per
				collection allowed at one time)</li>
		<li>`hasMorePages()` - does the endpoint have additional models</li>
		<li>`nextOffset()` - gets the offset for the next paging request</li>
		<li>`resetPaging()` - resets the internal paging variables</li>
		<li>`setLimit()` - change the number of models requested with each `fetchNext()` request</li>
	</ul>


	@see {@link CollectionProperty}
*/
export default class CollectionShadow extends Shadow {
	constructor(impl) {
		super(impl);

		this[_cache] = {};
	}

	/**
		Gets the endpoint for accessing the remote data source.

		@return {Object}
	*/
	get endpoint() {
		return this._endpoint;
	}

	/**
		Gets the endpoint for accessing the remote data source.

		@return {Object}
	*/
	get endpointId() {
		const ep = this._endpoint;

		return ep && ep.id;
	}

	/**
		Gets if a fetching operation that will replace ALL models is in progress.
	*/
	get fetching() {
		return this.$$().isFetching();
	}

	/**
		Gets if the collection has synced or had its data restored.
	*/
	get filled() {
		return this.synced || this.restored;
	}

	/**
		Gets the endpoint ID, which for {@link RestEndpointProperty} is its URL.

		@return {string}
	*/
	get id() {
		return this._endpoint && this._endpoint.id;
	}

	/** Gets the number of models being managed by the collection */
	get size() {
		return this._models.size;
	}

	//------------------------------------------------------------------------------------------------------
	// Paging API
	//------------------------------------------------------------------------------------------------------

	/**
		Gets the number of models to fetch with each paging request.
	*/
	get limit() {
		return this._limit;
	}

	/**
		Gets the offset for the next paging request.
	*/
	get nextOffset() {
		return this.$$().nextOffset();
	}

	/**
		Gets if a paging operation ({@link CollectionProperty#fetchNext}) call is in progress.
	*/
	get paging() {
		return this.$$().isPaging();
	}

	get restoring() {
		return this.$$().isRestoring();
	}

	/**
		Fetches the next set of models from the endpoint. This method differs from
		{@link CollectionProperty#fetch} by passing `offset` and `limit` filter criteria to the
		endpoint.

		@param {string} [mergeOp=REPLACE_OPTION] - one of `DEFAULTS_OPTION`, `MERGE_OPTION`, or
			`REPLACE_OPTION` and specifies how to combine an existing model with a matching ID
			with a newly retrieved model.

		@return {Promise} - resolves with a single argument of an array of model json objects as
			returned from the endpoint.
	*/
	fetchNext(mergeOp=REPLACE_OPTION) {
		return this.$$().fetchNext(mergeOp);
	}

	/**
		Gets if additional paging calls will return additional results.
	*/
	hasMorePages() {
		return this.$$().hasMorePages(this);
	}

	/**
		Sets the number of models to request with each paging request. The default paging size is
		50.

		@param {number} limit
	*/
	setLimit(limit) {
		this.$$().setLimit(limit);
	}

	//------------------------------------------------------------------------------------------------------
	// Autocheckpointing API
	//------------------------------------------------------------------------------------------------------

	/**
		Sets whether auto-checkpointing is enabled.

		@return {boolean}
	*/
	isAutocheckpoint() {
		return this.$$().isAutocheckpoint();
	}

	/**
		Sets whether auto-checkpointing should be enabled.

		@param {boolean} auto - `true` to enable.
	*/
	setAutocheckpoint(auto) {
		this.$$().setAutocheckpoint(auto);
	}

	/**
		Resets all dirty models to their last checkpoint and removes all unsaved models.
	*/
	resetToLastEndpointState() {
		const auto = this.isAutocheckpoint();

		this.forEach( m => {
				const m$ = m.$();

				if (m$.isNew()) {
					m$.destroy();
				} else if (auto && m$.isDirty()) {
					m$.resetToCheckpoint()
				}
			});
	}


	//------------------------------------------------------------------------------------------------------
	// Stable API
	//------------------------------------------------------------------------------------------------------

	/**
		Synchronously adds a new model object to the collection. Call `model.$().save()` to persist the newly
		added object.

		@param {object} state - the json model to add to the collection
		@param {string} [mergeOp=REPLACE_OPTION] - one of `DEFAULTS_OPTION`, `MERGE_OPTION`, or
			`REPLACE_OPTION` and specifies how to combine an existing model with a matching ID
			with a newly retrieved model.

		@return the object's ID. An ID is assigned if the 'id' parameter was not set and it could not
			be found in the `state` parameter.
	*/
	add(state, mergeOp=REPLACE_OPTION) {
		return this.$$().addModel(state, mergeOp);
	}

	/*
		@deprecated use {@link CollectionShadow#add}
	*/
	addModel(state, mergeOp=REPLACE_OPTION) {
		return this.$$().addModel(state, mergeOp);
	}

	/**
		Bulk adds multiple models. Models must have an ID as it is assumed they have been previously
		saved.

		@param {array} models - array of model values
		@param {string} [mergeOp=REPLACE_OPTION] - one of `DEFAULTS_OPTION`, `MERGE_OPTION`, or
			`REPLACE_OPTION` and specifies how to combine an existing model with a matching ID
			with a newly retrieved model.
		@param {boolean} [syncOp=true] - sets the `synced` flag to true if this parameter is true
	*/
	addModels(models, mergeOp=REPLACE_OPTION, syncOp) {
		this.$$().addModels(models, mergeOp, syncOp);
	}

	/**
		Gets the shadow models currently managed by the collection.

		@return {array} all models being managed by the collection
	*/
	all() {
		return this.valuesArray();
	}

	/**
		Removes all models from the collection and marks the collection as having not synched with the
		endpoint.
	*/
	clear() {
		this.$$().removeAllModels();
	}

	/**
		Combines an {@link CollectionShadow#add} and {@link CollectionShadow#save} actions.

		@param {Object} model - the json data

		@return {Promise} resolves with the f.lux shadow state for the new model
	*/
	create(model) {
		return this.$$().create(model);
	}

	/**
		Permantently deletes the model with the endpoint and removes it from the collection.

		@param id - the model ID to delete

		@return {Promise} resolves with the ID for the removed mdoel
	*/
	destroy(id) {
		return this.$$().destroy(id);
	}

	/**
		Gets an iterator with [ID, model] paris.

		@return {Array}
	*/
	entries() {
		return this.$$().modelEntries(this);
	}

	/**
		Tests whether all elements in the array pass the test implemented by the provided function.
	*/
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

	/**
		Fetches all the models from the endpoint.

		@param [filter=null] - filter object created using the endpoint.
		@param {string} [mergeOp=REPLACE_OPTION] - one of `DEFAULTS_OPTION`, `MERGE_OPTION`, or
			`REPLACE_OPTION` and specifies how to combine an existing model with a matching ID
			with a newly retrieved model.

		@return {Promise} resolves with the json models from the endpoint
	*/
	fetch(filter=null, mergeOp=REPLACE_OPTION) {
		return this.$$().fetch(filter, mergeOp);
	}

	/**
		Creates an array with all elements that pass the test implemented by the provided function.
	*/
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

	/**
		Gets a model by ID. The method looks for a matching model in the collection. If one
		is not found then one is requested from the endpoint.

		@param id - the model ID

		@return {Promise} reolves with the model or undefined if one is not found
	*/
	find(id) {
		return this.$$().find(id);
	}

	/**
		Gets the first model that satisfies the provided testing function.

		@param iteratee - Function to execute on each value in the array, taking three arguments:
			element, ID, and the collection reference.
		@param {object} [context] - object to use as `this` when executing callback

		@return the model or undefined if one is not found
	*/
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
	}

	/**
		Executes a provided function once for each array element.

		@param iteratee - Function to execute on each value in the array, taking three arguments:
			element, ID, and the collection reference.
		@param {object} [context] - object to use as `this` when executing callback
	*/
	forEach(iteratee, context) {
		const keys = this.keysArray();
		var key;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];

			iteratee.call(context, this.get(key), key, this);
		}
	}

	/**
		Gets a model by ID. The method looks for a matching model in the collection and never
		looks for one remotely through the endpoint.

		@param id - the model ID

		@return {Object} the model or undefined if one is not found
	*/
	get(id) {
		return this.$$().getModel(id, this);
	}

	/**
		Inspired by [Lodash groupBy()](https://lodash.com/docs/4.17.4#groupBy) method.

		Creates an object composed of keys generated from the results of running each element of
		collection thru iteratee. The order of grouped values is determined by the order they occur
		in collection. The corresponding value of each key is an array of elements responsible for
		generating the key. The iteratee is invoked with one argument: (value).

		@see https://lodash.com/docs/4.17.4#groupBy
	*/
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

	/**
		Gets if the collection contains a matching model.

		@param id - the model ID

		@return {boolean}
	*/
	has(id) {
		return this.$$().hasModel(id, this);
	}

	/**
		Gets if the collection is paging, fetching, or restoring data.
	*/
	isBusy() {
		return this.paging || this.fetching || this.restoring;
	}

	/**
		Gets if the collection is active (has a shadow) and an endpoint.
	*/
	isConnected() {
		return this.$$().isConnected();
	}

	/**
		Gets if a model has never been persisted to the endpoint.
	*/
	isNew(id) {
		return this.$$().isNew(id, this);
	}

	/**
		Gets an iterator containing each model IDs.

		@return {Iterator}
	*/
	keys() {
		return this.$$().modelKeys(this);
	}

	/**
		Gets an array containing each model iDs.

		@return {Array}
	*/
	keysArray() {
		if (!this[_cache][_keysArray]) {
			this[_cache][_keysArray] = this.$$().modelKeysArray(this);
		}

		return this[_cache][_keysArray];
	}

	/**
		Creates a new array with the results of calling a provided function on every element in
		this collection.

		@param iteratee - Function that produces an element of the new array, taking three arguments:
			element, ID, and the collection reference.
		@param {object} [context] - object to use as `this` when executing callback
	*/
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

	/**
		Applies a function against an accumulator and each value of the collection to reduce it
		to a single value.

		@param iteratee - Function to execute on each value in the array, taking four arguments:
			accumulator, element, ID, and the collection reference.
		@param acc - the initial accumulator value
		@param {object} [context] - object to use as `this` when executing callback
	*/
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

	/**
		Synchronously removes the model from the collection without performing an endpoint operation.

		@param id - the model id or cid
	*/
	remove(id) {
		return this.$$().remove(id);
	}

	/**
		Experimental feature to update values with any modifications from the server.

		Question: should this be delegated to the endpoint?

		@experimental
		@ignore
	*/
	resync() {
		return this.$$().resync();
	}

	/**
		Sets the {@link CollectionProperty#endpoint}.
	*/
	setEndpoint(endPoint) {
		this.$$().setEndpoint(endPoint);
	}

	/**
		Bulk replaces current models with an array of new models.

		@param {array} models - array of model values
	*/
	setModels(models) {
		this.$$().setModels(models);
	}

	/**
		Tests whether some element in the array passes the test implemented by the provided function.

		@param iteratee - Function to test for each element, taking three arguments:
			element, ID, and the collection reference.
		@param {object} [context] - object to use as `this` when executing callback
	*/
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
		Sorts using the same arguments as [Lodash sortBy()](https://lodash.com/docs#sortBy).
	*/
	sortBy(iteratee) {
		const values = this.valuesArray();

		return sortBy.apply(null, [values, iteratee]);
	}

	sort(comparator) {
		const values = this.valuesArray();

		return values.sort(comparator);
	}

	/**
		Gets an iterator containing each f.lux shadow state model.

		@return {Iterator}
	*/
	values() {
		return this.$$().modelValues(this);
	}

	/**
		Gets an array containing each model iDs.

		@return {Array}
	*/
	valuesArray() {
		if (!this[_cache][_valuesArray]) {
			this[_cache][_valuesArray] = this.$$().modelsArray(this);
		}

		return this[_cache][_valuesArray];
	}

	[Symbol.iterator]() { return this.$$().modelEntries(this) }
}

