import Emitter from "component-emitter";
import invariant from "invariant";

import ArrayProperty from "../ArrayProperty";
import KeyedProperty from "../KeyedProperty";
import MapProperty from "../MapProperty";
import PrimitiveProperty from "../PrimitiveProperty";
import Store from "../Store";

import {
	assert,
	isObject,
	uuid,
	doneIterator,
	iteratorFor,
	iterateOver,
} from "akutils";

import appDebug, { CollectionPropertyKey as DebugKey } from "../debug";
import CollectionShadow from "./CollectionShadow";
import ModelProperty from "./ModelProperty";


const debug = appDebug(DebugKey);

const _endpoint = "_endpoint";
//const _fetching = '_fetching';
const _id2cid = "_id2cid";
const _idName = "idName";
const _lastPageSize = 'lastPageSize';
const _limit = '_limit';
const _models = "_models";
const _nextOffset = 'nextOffset';
const _paging = '_paging';
const _synced = "synced";

const _offlineState = Symbol('offlineState');
const _fetching = Symbol('fetching');
const _middleware = Symbol("middleware");

/*
	Event emitted on collection changes.
*/
export const ChangeEvent = "change";

/*
	Middleware operation for create requests.
*/
export const CreateOp = "create";
/*
	Middleware operation for destroy requests.
*/
export const DestroyOp = "destroy";
/*
	Middleware operation for fetch requests.
*/
export const FetchOp = "fetch";
/*
	Middleware operation for find requests.
*/
export const FindOp = "find";
/*
	Middleware operation for update requests.
*/
export const UpdateOp = "update";
/*
	All middleware operations.
*/
export const AllOp = [ CreateOp, DestroyOp, FetchOp, FindOp, UpdateOp ];

import { DEFAULTS_OPTION, MERGE_OPTION, NONE_OPTION, REPLACE_OPTION, REPLACE_ALL_OPTION } from "./CollectionOptions";


/*
	Rework API:
		- same ctor as all other properties
		- separate method to setup element shader:
			- setElementShader(shader/factoryShader)
			- setElementType(type, initState, autoshadow, readonly)
		- method to get element shader (shader.modelsShader.element)


	CollectionProperty.dataSpec = {
		[_idName]: StateTypes.Primitive.initialState("id"),
		[_fetching]: StateTypes.Primitive.initialState(false).readonly,
		[_id2cid]: StateTypes.Map,
		[_synced]: StateTypes.Primitive.initialState(false).autoshadowOff.readonly,
		[_models]: StateTypes.mapOf(StateTypes.property(ModelProperty))
	}
*/
export default class CollectionProperty extends KeyedProperty {
	constructor(MemberPropertyClass=MapProperty, autoShadow=true, readonly=false) {
		super({}, false);

		this[_middleware] = {
			[CreateOp]: [],
			[DestroyOp]: [],
			[FetchOp]: [],
			[FindOp]: [],
			[UpdateOp]: [],
		}

		// keep isFetching as an instance variable because transient data and gives immediate
		// feedback to prevent concurrent fetches
		this[_fetching] = false;

		this.addProperty(_idName, new PrimitiveProperty("id", true));
		this.addProperty(_id2cid, new MapProperty({}, true));
		this.addProperty(_synced, new PrimitiveProperty(false, false, true));

		// pagingTime instance variable used for ensuring overlapping paging requests do not mess up offset
		// this can happen when a paging request is in progress when limit is changed
		this.pagingTime = null;
		this.addProperty(_lastPageSize, new PrimitiveProperty(null, false, true));
		this.addProperty(_limit, new PrimitiveProperty(50, false, true));
		this.addProperty(_nextOffset, new PrimitiveProperty(0, false, true));
		this.addProperty(_paging, new PrimitiveProperty(false, false, true));

		// '_models' property contains ModelProperty objects which in turn keep their model state in
		// the 'data' whose type is specified by the 'MemberPropertyClass' parameter.
		const models = new MapProperty();
		const modelsShader = models.shader();

		this.addProperty(_models, models);
		modelsShader.setElementClass(ModelProperty, {}, true, false);
		modelsShader.elementShader.addPropertyClass("data", MemberPropertyClass, {}, autoShadow, readonly);
	}

	onPropertyDidUpdate() {
		super.onPropertyWillUpdate();

		this.emit(ChangeEvent, this._, this);
	}


	//------------------------------------------------------------------------------------------------------
	// Offline data support API
	//------------------------------------------------------------------------------------------------------

	/*
		Experimental feature

		Gets an object capable of providing a persisted version of this collection. The object must
		expose a single method with the form:

			restore()
				Method sets the collection state for offline access.
	*/
	getOfflineState() {
		return this[_offlineState];
	}

	/*
		Experimental feature

		Sets an object capable of providing a persisted version of this collection. The object must
		expose a single method with the form:

			restore()
				Method sets the collection state for offline access.
	*/
	setOfflineState(offline) {
		this[_offlineState] = offline;
	}


	//------------------------------------------------------------------------------------------------------
	// Middleware API
	//------------------------------------------------------------------------------------------------------

	/*
		Registers collection middleware operation. A middleware operation is invoked before each asynchronous/
		network operation. Middleware operations are functions with the following format:
			fn(shadow, property)

		Middleware functions must return a promise and are invoked in the order registered. A function
		generating an error will terminate the middleware chain and the collection operation will not
		be performed.
	*/
	use(op, mw) {
		op = Array.isArray(op) ?op :[ op ];

		assert( a => { for (const o of op) a.has(this[_middleware], o) });

		for (const mwop of op) {
			this[_middleware][mwop].push(mw);
		}
	}

	/*
		Serially invokes each middleware function for the specified operation.
	*/
	_on(op, idx=0) {
		assert( a => a.is(this[_middleware][op], `Unknown middleware operation: ${op}`) );

		const mw = this[_middleware][op];
		const next = mw[idx];

		if (!next) {
			return Store.resolve(this._);
		}

		try {
			return next(this._, this, op)
				.then( () => this._on(op, idx+1) );
		} catch(error) {
			return Store.reject(error);
		}
	}


	//------------------------------------------------------------------------------------------------------
	// Paging API (could improve by adding two offsets and maintain max pages)
	//------------------------------------------------------------------------------------------------------

	fetchNext(mergeOp=MERGE_OPTION) {
		if (this.pagingTime) {
			throw new Error("Paging operation in progress");
		} else if (!this.hasMorePages()) {
			return Store.resolve(this._);
		}

		const filter = this.endpoint.queryBuilder();
		const time = this.pagingTime = Date.now();

		this.set(_paging, true);

		filter.equals("offset", this._[_nextOffset]);
		filter.equals("limit", this._[_limit]);

		return this.fetch(filter, mergeOp, false, (error, models) => {
				// bail if paging times do not match (offset likely reset)
				if (time !== this.pagingTime) { return }

				this.pagingTime = null;
				this.set(_paging, false);
				if (error) { return }

				this.set(_nextOffset, this._[_nextOffset] + models.length);
				this.set(_lastPageSize, models.length);

				if (models.length < this._[_limit]) {
					this.set(_synced, true);
				}
			});
	}

	isPaging(state=this._) {
		// use pagingTime instance variable (instant) and _paging state variable (tied to state) to
		// return the most conservative value
		return this.pagingTime || state[_paging];
	}

	hasMorePages(state=this._) {
		return this.isConnected() &&
			!state[_synced] &&
			(!state[_lastPageSize] || this._[_lastPageSize] >= this._[_limit]);
	}

	nextOffset() {
		return this.get(_nextOffset);
	}

	resetPaging() {
		this.pagingTime = null;
		this.set(_lastPageSize, null);
		this.set(_nextOffset, 0);
		this.set(_paging, false);
	}

	setLimit(limit) {
		this.pagingTime = null;

		this.set(_limit, limit);
		this.set(_lastPageSize, null);
		this.set(_nextOffset, 0);
		this.set(_paging, false);
	}

	//------------------------------------------------------------------------------------------------------
	// Experimental data spec stuff
	//------------------------------------------------------------------------------------------------------

	setElementClass(MemberPropertyClass=MapProperty, initialState={}, autoShadow=true, readonly=false) {
		const models = this._[_models];
		const modelsShader = models.shader();

		modelsShader.elementShader.setElementClass(MemberPropertyClass, initialState, autoShadow, readonly);
	}


	//------------------------------------------------------------------------------------------------------
	// Endpoint methods
	//------------------------------------------------------------------------------------------------------

	get endpoint() {
		return this.isActive() && this._[_endpoint];
	}

	get endpointId() {
		const endpoint = this.endpoint;

		return endpoint && endpoint.id;
	}

	clearEndpoint() {
		this.removeAllModels();
		this.removeProperty(_endpoint);
	}

	setEndpoint(endPoint) {
		this.resetPaging();
		this.removeAllModels();
		this.addProperty(_endpoint, endPoint);
	}

	//------------------------------------------------------------------------------------------------------
	// Property subclasses may want to override thise methods
	//------------------------------------------------------------------------------------------------------

	shadowClass() {
		return CollectionShadow;
	}


	//------------------------------------------------------------------------------------------------------
	// Collection methods
	//------------------------------------------------------------------------------------------------------

	get modelsCount() {
		return this._[_models].size;
	}

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
		if (!this.isConnected()) { throw new Error(`Collection is not connected.`) }

		const id = this.extractId(state);
		var modelId;

		// just add the model
		if (!id || !this.hasModel(id) || mergeOp === REPLACE_OPTION) {
			const modelDefn = ModelProperty.modelDefinitionFor(state, this);
			const models = this._[_models];

			models.set(modelDefn.cid, modelDefn);

			modelId = modelDefn.id;
		} else {
			const currModel = this._getModel(id);

			switch (mergeOp) {
				case NONE_OPTION:
					break;
				case MERGE_OPTION:
					currModel.merge(state);
					break;
				case REPLACE_OPTION:
					currModel.setData(state);
					break;
				case DEFAULTS_OPTION:
					currModel.defaults(state);
					break;
				default:
					throw new Error(`Invalid post-save option: ${mergeOp}`)
			}

			modelId = currModel.id;
		}

		return modelId;
	}

	/*
		Bulk adds multiple models. Models must have an ID as it is assumed they have been previously
		saved.

		Parameters:
			models - array of model values
			merge - boolean declaring whether each state should be merged over an existing model with
				the same ID. False means a current model will be replaced with the new model value.
	*/
	addModels(models, mergeOp=DEFAULTS_OPTION, syncOp=true) {
		if (!this.isConnected()) { throw new(`Collection ${this.slashPath} is not connected`) }

		var id, state;

		if (syncOp) {
			this.set(_synced, true);
		}

		for (let i=0, len=models.length; i<len; i++) {
			this.addModel(models[i], mergeOp);
		}
	}

	/*
		Combines an add and save actions.
	*/
	create(model) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath} is not connected`) }

		const cid = this.addModel(model);

		return this.save(cid);
	}

	destroy(id) {
		if (!this.hasModel(id)) {
			return Store.resolve(this._);
		}

		try {
			const model = this._getModel(id);

			if (!model || model.isNew()) {
				return Store.resolve(this._);
			}

			return this._on(DestroyOp)
				.then( () => this.endpoint.doDelete(id) )
				.then( () => {
						this._[_models].delete(model.cid);
						this._[_id2cid].delete(model.id);

						return id;
					})
				.catch( error => this.onError(error, `Destroy model: ${id}`) );
		} catch(error) {
			this.onError(error, `Destroy model: ${id}`);
		}
	}

	// No reset option - always resets
	fetch(filter=null, mergeOp=REPLACE_OPTION, replaceAll=true, callback) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath} is not connected`) }

		const syncOp = !filter;

		this.setFetching(true);

		try {
			return this._on(FetchOp)
				.then( () => this.endpoint.doFetch(filter) )
				.then( models => {
						try {
							this.setFetching(false);

							// invoke the callback before processing models
							callback && callback(null, models);

							if (replaceAll) {
								this.setModels(models, syncOp);
							} else {
								this.addModels(models, mergeOp, syncOp);
							}

							return models;
						} catch(error) {
							return this.onError(error, "Fetch error while setting models");
						}
					})
				.catch( error => {
						this.setFetching(false);

						// invoke the callback with the error
						callback && callback(error, null);

						return this.onError(error, `Fetch all models`);
					});
		} catch(error) {
			this.setFetching(false);

			// invoke the callback with the error
			callback && callback(error, null);

			throw error;
		}
	}

	find(id) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath} is not connected`) }

		try {
			const model = this._getModel(id);

			if (model) {
				return Store.resolve(model.data);
			} else {
				return this._on(FindOp)
					.then( () => this.endpoint.doFind(id) )
					.then( state => {
							this.addModel(state, NONE_OPTION);

							return this.getModel(id);
						})
					.catch( error => this.onError(error, `Find model ${id}`) );
			}
		} catch(error) {
			this.onError(error, `Find model ${id}`);
		}
	}

	getModel(id, state=this._) {
		const model = this._getModel(id, state);

		return model && model.data;
	}

	hasModel(id, state=this._) {
		return state[_id2cid].has(id) || state[_models].has(id);
	}

	/*
		Gets if the collection is active (has a shadow) and an endpoint.
	*/
	isConnected() {
		return this._[_endpoint] && this._[_endpoint].isConnected();
	}

	isFetching() {
		return this[_fetching];
	}

	isNew(id, state=this._) {
		const model = this._getModel(id, state);

		return model && model.isNew();

	}

	/*
		Gets the shadow models currently managed by the collection.

		Returns an array of models already fetched and/or added.
	*/
	modelsArray(state) {
		if (!state && !this.isConnected()) { throw new Error(`Collection is not connected.`) }

		state = state || this._;

		const models = state[_models];
		const keys = Object.keys(models);
		const result = [];

		for (let i=0, len=keys.length; i<len; i++) {
			result.push( models[keys[i]].data );
		}

		return result;
	}

	modelEntries(state) {
		if (!state && !this.isActive()) { return doneIterator; }

		state = state || this._;

		const models = state[_models];
		const keys = this.modelKeysArray(state);

		return iterateOver(keys, key => [key, this.getModel(key)] );
	}

	modelKeys(state=this._) {
		// too brute force but quick and sure to work
		return iteratorFor(this.modelKeysArray(state));
	}

	modelKeysArray(state) {
		if (!state && !this.isActive()) { return doneIterator; }

		state = state || this._;

		return Object.keys(state[_models]);
	}

	modelValues(state=this._) {
		return iterateOver(this.modelKeysArray(state), key => this.getModel(key, state));
	}

	remove(id) {
		if (!this.hasModel(id)) { return }

		const model = this._getModel(id);
		const prevShadow = this._;

		this._[_models].delete(model.cid);
		this._[_id2cid].delete(model.id);
	}

	/*
		Removes all models from the collection and marks the collection as having not synched with the
		endpoint.
	*/
	removeAllModels() {
		if (!this.isActive()) { return }

		this.set(_synced, false);
		this._[_models].clear();
		this._[_id2cid].clear();
	}

	/*
		Saves a model through the endpoint.

		Parameters:
			id - the model id or cid
			mergeOp - one of constants: DEFAULTS, MERGE, NONE, REPLACE

		Returns a promise. The resolve function arguments are F.lux models and this adapter as arguments
	*/
	save(id, mergeOp=DEFAULTS_OPTION) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath} is not connected`) }

		try {
			const model = this._getModel(id);
			const cid = model.cid;
			const shadow = model.data;
			const shadowState = shadow.__.nextState();
			const opName = this.isNew(shadow) ?CrateOp :UpdateOp;
			const op = this.isNew(shadow)
						?this.endpoint.doCreate.bind(this.endpoint, shadow, shadowState)
						:this.endpoint.doUpdate.bind(this.endpoint, id, shadow, shadowState);

			this._on(opName)
				.then( () => {
						if (this.isNew(shadow)) {
							return this.endpoint.doCreate(this.endpoint, shadow, shadowState);
						} else {
							return this.endpoint.doUpdate(this.endpoint, id, shadow, shadowState);
						}
					})
				.then( savedState => {
						const currModel = model.$.latest();
						const savedId = this.extractId(savedState);

						// Put an entry in id->cid mapping
						if (savedId != id) {
							this._[_id2cid].set(id, cid);
						}

						switch (mergeOp) {
							case NONE_OPTION:
								if (savedId !== id) {
									currModel.changeId(savedId);
								}

								break;
							case MERGE_OPTION:
								currModel.merge(savedState);
								break;
							case REPLACE_OPTION:
								currModel.setData(savedState);
								break;
							case DEFAULTS_OPTION:
								currModel.defaults(saveState);
								break;
							default:
								return Store.reject(`Invalid post-save option: ${mergeOp}`);
						}

						return this.get(id);
					})
				.catch( error => this.onError(error, `Save ${id} - cid=${shadow.$.cid}`) );
		} catch(error) {
			this.onError(error, `Save ${id} - cid=${shadow.$.cid}`);
		}
	}

	setIdName(idName) {
		this._[_idName] = idName;
	}

	setFetching(fetching) {
		this[_fetching] = fetching;
		this.touch();
//		this.set(_fetching, fetching);
	}

	/*
		Bulk replaces current models with an array of new models.

		See comments for addModels().
	*/
	setModels(models, syncOp=true) {
		this.removeAllModels();
		this.addModels(models, REPLACE_OPTION, syncOp);
	}


	//------------------------------------------------------------------------------------------------------
	// Methods Collection subclasses may want to override
	//------------------------------------------------------------------------------------------------------

	/*
		Generates an ID for a new object. The default implementation generates: temp-[UUID].
	*/
	makeId() {
		return `temp-${ uuid() }`;
	}

	/*
		Subclasses can override this method to remove underlying transport specific properties.
	*/
	clean(json) {
		return json;
	}

	/*
		Used by the private _shadow() method to get the id from the model JSON representation as returned by the
		subclass doXXX() apis. The default implementation simply returns the 'id' model property.
	*/
	extractId(model) {
		var idName = this._[_idName];

		return isObject(model) ?model[idName] :model;
	}

	onError(error, opMsg) {
		var msg;

		if (error.status) {
			let statusText = error.status
				?error.response.statusText || `HTTP Code=${error.status}`
				:"HTTP status code not specified"
			msg = `Error during collection operation '${opMsg} (${ this.endpointId })' - ` +
			      `Server Error: status=${statusText}`;
		} else if (error.message) {
			msg = `Error during collection operation '${opMsg} (${ this.endpointId })' - Collection Error: ${error.message}`;
		} else {
			msg = `Error during collection operation '${opMsg} (${ this.endpointId })' - Error: ${error}`;
		}

		debug(`${DebugKey} Error: ${msg}`);
		if (error.stack) { debug(error.stack) }

		return Store.reject(new Error(msg));
	}

	//------------------------------------------------------------------------------------------------------
	// Private methods
	//------------------------------------------------------------------------------------------------------

	/*
		Gets the Model container object NOT the actual model.
	*/
	_getModel(id, state=this._) {
		const id2cid = state[_id2cid];
		var cid = id2cid.has(id) ?id2cid.get(id) :id;

		return state[_models].get(cid);
	}
}

// Mix in `Emitter`
Emitter(CollectionProperty.prototype);