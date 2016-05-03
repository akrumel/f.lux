import invariant from "invariant";

import ArrayProperty from "../ArrayProperty";
import KeyedProperty from "../KeyedProperty";
import MapProperty from "../MapProperty";
import PrimitiveProperty from "../PrimitiveProperty";
import Store from "../Store";

import assert from "../utils/assert";
import isObject from "../utils/isObject";
import uuid from "../utils/uuid";
import doneIterator from "../utils/doneIterator";
import iteratorFor from "../utils/iteratorFor";
import iterateOver from "../utils/iterateOver";

import CollectionShadow from "./CollectionShadow";
import ModelProperty from "./ModelProperty";


const _endpoint = "_endpoint";
const _fetching = 'fetching';
const _id2cid = "_id2cid";
const _idName = "idName";
const _lastPageSize = 'lastPageSize';
const _limit = '_limit';
const _models = "_models";
const _nextOffset = 'nextOffset';
const _paging = '_paging';
const _synced = "synced";

const _isFetching = Symbol('isFetching');


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

		// keep isFetching as an instance variable because transient data and so can give immediate
		// feedback to prevent concurrent fetches
		this[_isFetching] = false;

		this.addProperty(_idName, new PrimitiveProperty("id", true));
		this.addProperty(_fetching, new PrimitiveProperty(false, false, true));
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

	resetPaging() {
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
		return state[_models].size;
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

		// just add the model
		if (!id || !this.hasModel(id) || mergeOp === REPLACE_OPTION) {
			const modelDefn = ModelProperty.modelDefinitionFor(state, this);
			const models = this._[_models];

			models.set(modelDefn.cid, modelDefn);

			return modelDefn.id;
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

			return currModel.id;
		}
	}

	/*
		Bulk adds multiple models. Models must have an ID as it is assumed they have been previously
		saved.

		Parameters:
			states - array of model values
			merge - boolean declaring whether each state should be merged over an existing model with
				the same ID. False means a current model will be replaced with the new model value.
	*/
	addModels(states, mergeOp=DEFAULTS_OPTION, syncOp=true) {
		if (!this.isConnected()) { throw new(`Collection ${this.slashPath} is not connected`) }

		var id, state;

		if (syncOp) {
			this.set(_synced, true);
		}

		for (let i=0, len=states.length; i<len; i++) {
			this.addModel(states[i], mergeOp);
		}
	}

	/*
		Combines an add and save actions.
	*/
	create(state) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath} is not connected`) }

		const cid = this.addModel(states);

		return Store.promise( (resolve, reject) => {
			// wait for the new model to be placed into state
			this.store.waitFor( () => {
					try {
						this.save(cid)
							.then(resolve)
							.catch(reject);
					} catch(error) {
						this.onError(error, "Fetch all models", reject);
					}
				});
		});
	}


	destroy(id) {
		if (!this.hasModel(id)) {
			return Store.resolve(this._);
		}

		return Store.promise( (resolve, reject) => {
				try {
					const model = this._getModel(id);

					if (!model || model.isNew()) {
						return resolve(this._);
					}

					this.endpoint.doDelete(id)
						.then( () => {
								this._[_models].delete(model.cid);
								this._[_id2cid].delete(model.id);

								resolve(this._);
							})
						.catch( error => this.onError(error, "Fetch all models", reject) );
				} catch(error) {
					this.onError(error, "Fetch all models", reject);
				}
			});
	}

	// No reset option - always resets
	fetch(filter=null, mergeOp=REPLACE_OPTION, replaceAll=true, callback) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath} is not connected`) }

		const syncOp = !filter;

		this.setIsFetching(true);

		try {
			return this.endpoint.doFetch(filter)
				.then( models => {
						try {
							this.setIsFetching(false);

							// invoke the callback before processing models
							callback && callback(null, models);

							if (replaceAll) {
								this.setModels(models, syncOp);
							} else {
								this.addModels(models, mergeOp, syncOp);
							}

							this.store.updateNow();

							return models;
						} catch(error) {
							return this.onError(error, "Fetch error while setting models");
						}
					})
				.catch( error => {
						this.setIsFetching(false);

						// invoke the callback with the error
						callback && callback(error, null);

						return this.onError(error, "Fetch all models")
					});
			} catch(error) {
				this.setIsFetching(false);

				// invoke the callback with the error
				callback && callback(error, null);

				throw error;
			}
	}

	find(id) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath} is not connected`) }

		return Store.promise( (resolve, reject) => {
				try {
					const model = this._getModel(id);

					if (model) {
						//log( l => l.requestSuccess(this, `Find model ${ mid(id) }`) );

						resolve(model.data);
					} else {
						this.endpoint.doFind(id)
							.then( state => {
									this.addModel(state, NONE_OPTION);

									this.store.waitFor( () => {
											resolve(this.getModel(id));
										});
								})
							.catch( error => this.onError(error, `Find model ${id}`, reject) );
					}
				} catch(error) {
					this.onError(error, `Find model ${id}`, reject);
				}
			});
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

		return Store.promise( (resolve, reject) => {
				try {
					const model = this._getModel(id);
					const cid = model.cid;
					const shadow = model.data;
					const shadowState = shadow.__.state;

					const op = this.isNew(shadow)
								?this.endpoint.doCreate.bind(this.endpoint, shadow, shadowState)
								:this.endpoint.doUpdate.bind(this.endpoint, id, shadow, shadowState);

					op()
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
										return reject(`Invalid post-save option: ${mergeOp}`)
								}
							})
						.catch( error => this.onError(error, `Save ${id} - cid=${shadow.$.cid}`, reject) );
				} catch(error) {
					this.onError(error, "Save model", reject);
				}
			});
	}

	setIdName(idName) {
		this._[_idName] = idName;
	}

	setIsFetching(fetching) {
		this[_isFetching] = fetching;
		this.set(_fetching, fetching);
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

	onError(error, opMsg, reject) {
		var msg;

		if (error.status) {
			msg = `Error during collection operation '${opMsg}' - Server Error: status=` +
			      `${error.status} (${error.response.statusText})`;
		} else if (error.message) {
			msg = `Error during collection operation '${opMsg}' - Collection Error: ${error.message}`;
		} else {
			msg = `Error during collection operation '${opMsg}' - Error: ${error}`;
		}

		console.warn(msg);
		if (error.stack) { console.warn(error.stack) }

		if (reject) {
			reject(new Error(msg));
		} else {
			return Store.reject(msg);
		}
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