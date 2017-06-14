import {
	assert,
	uuid,
	doneIterator,
	iteratorFor,
	iterateOver,
} from "akutils";
import Symbol from "es6-symbol";
import isPlainObject from "lodash.isplainobject";

import Emitter from "component-emitter";

import ArrayProperty from "../ArrayProperty";
import createPropertyClass from "../createPropertyClass";
import KeyedApi from "../KeyedApi";
import MapProperty from "../MapProperty";
import ObjectShadowImpl from "../ObjectShadowImpl";
import PrimitiveProperty from "../PrimitiveProperty";
import Property from "../Property";
import Shadow from "../Shadow";
import StateType from "../StateType";
import Store from "../Store";

import CollectionShadow from "./CollectionShadow";
import ModelProperty from "./ModelProperty";


import appDebug, { CollectionPropertyKey as DebugKey } from "../debug";
const debug = appDebug(DebugKey);


const _endpoint = "_endpoint";
const _id2cid = "_id2cid";
const _idName = "idName";
const _lastPageSize = "lastPageSize";
const _limit = "_limit";
const _models = "_models";
const _nextOffset = "nextOffset";
const _offlineKey = "offlineKey";
const _paging = "_paging";
const _restored = "restored";
const _synced = "synced";

const _autocheckpoint = Symbol("autocheckpoint");
const _fetching = Symbol("fetching");
const _middleware = Symbol("middleware");
const _restoring = Symbol("restoring");

export const SerializeVersion = 1;

/**
	Event emitted on collection changes.
*/
export const ChangeEvent = "change";
/**
	Event emitted on collection destroy() success.
*/
export const DeletedEvent = "deleted";
/**
	Event emitted on collection fetch() success.
*/
export const FetchedEvent = "fetched";
/**
	Event emitted on collection find() success.
*/
export const FoundEvent = "sound";
/**
	Event emitted on error during an operation.
*/
export const ErrorEvent = "error";
/**
	Event emitted on collection save() success.
*/
export const SavedEvent = "saved";

/**
	Middleware operation for create requests.
*/
export const CreateOp = "create";
/**
	Middleware operation for destroy requests.
*/
export const DestroyOp = "destroy";
/**
	Middleware operation for fetch requests.
*/
export const FetchOp = "fetch";
/**
	Middleware operation for find requests.
*/
export const FindOp = "find";
/**
	Middleware operation for update requests.
*/
export const UpdateOp = "update";
/**
	All middleware operations.
*/
export const AllOp = [ CreateOp, DestroyOp, FetchOp, FindOp, UpdateOp ];

import { DEFAULTS_OPTION, MERGE_OPTION, NONE_OPTION, REPLACE_OPTION, REPLACE_ALL_OPTION } from "./CollectionOptions";


/*
	Improvements
		* Paging - consider either adding an endpoint fetchNext() method or make setting the
			query parameters pluggable
		* Serialization - make an abstract structure so less brittle to internal data
			structure changes
		* Paging - sliding window support
		* Isolated objects - reduce mapping costs for large collections
		* Map models onto collection
*/

/**
	`CollectionProperty` provides a standard means for accessing remote data and was inspired by
	[Backbone collections](http://backbonejs.org/#Collection). The protocol for interacting with
	the data source is delegated to an *endpoint* so the same application logic can work with data from
	a RESTful api, graphql, local test data, or even an in-browser database like localforage. F.lux
	ships with support for two endpoints, {@link RestEndpointProperty} and {@link PojoEndpointProperty}.

	F.lux ships with a [example](https://github.com/akrumel/f.lux/tree/master/examples/todo-collections)
	using collections in a todo application utilizing an in memory data source. The example uses a local
	data source to make setup dead simple while still demonstrating the basic features of creating
	and interacting with collections.

	## Basic operations

	<ul>
		<li>`add(state, mergeOp)`</li>
		<li>`all()`</li>
		<li>`clear()`</li>
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


	## Model access

	Properties managed by a collection receive an f.lux accessor (`$()`) with additional
	capabilities related to the collection. The accessor class is ${@link ShadowModelAccess}.

	<ul>
		<li>`collection()` - gets the {@link Collection} managing this model</li>
		<li>`destroy()` - permanently deletes the model from the collection using
			{@link CollectionProperty#destroy}</li>
		<li>`id()` - gets the ID used by the data source for tracking the model</li>
		<li>`isWaiting()` - is a network operation in progress associated with this model</li>
		<li>`isDirty()` - has the model been modified since it was last saved/retrieved</li>
		<li>`isNew()` - gets whether the model has yet to be written to the collection's endpoint</li>
		<li>`remove()` - removes the model from the collection using {@link CollectionProperty#remove}</li>
		<li>`save()` - save the model using {@link CollectionProperty#save}</li>
	</ul>


	## Paging

	The collection provides redimentary paging support for potentially large collections. The
	current implementation simply grows the collection size wtih each call to `fetchNext()`
	and does not make any efforts to remove previous models. (A likely future enhancement)

	<ul>
		<li>`fetchNext()` - gets the next group of models</li>
		<li>`isPaging()` - gets if a paging request is outstanding (only one paging request per
				collection allowed at one time)</li>
		<li>`hasMorePages()` - does the endpoint have additional models</li>
		<li>`nextOffset()` - gets the offset for the next paging request</li>
		<li>`resetPaging()` - resets the internal paging variables</li>
		<li>`setLimit()` - change the number of models requested with each `fetchNext()` request</li>
	</ul>


	## Endpoints

	Collections represent a protocol independent means of managing persistent models that
	exist outside the application state. Endpoints implement the protocol connection to the
	data source. F.lux endpoints have been implemented for RESTful server apis, in-memory,
	GraphQL, Sqlite, and Couchbase. F.lux ships with support for RESTful servers and in-memory.

	A simple, explicit example of creating a collection and assigning an endpoint:

	```
	const rootProperty = store.root();
	const collection = new CollectionProperty(colType);
	const ep = new RestEndpointProperty.createFor("http://some-url.com/an-api");

	collection.setEndpoint(ep);

	root._keyed.addProperty("aCollection", collection);
	```

	The [Todo Collection Example](https://github.com/akrumel/f.lux/tree/master/examples/todo-collections)
	demonstrates a more typical example of setting up a collection.

	<div data-ice="see"><h4>See:</h4>
		<ul>
			<li>{@link RestEndpointProperty}</li>
			<li>{@link PojoEndpointProperty}</li>
		</ul>
	</div>


	## Offline support

	Collections support offline first capability. To enable, you must:

	<ul>
		<li></li>
		<li></li>
	</ul>

	## Query filters

	Collection models are retrieved in full using {@link CollectionProperty#fetch} that has the following
	signature:

	```
	fetch(filter=null, mergeOp=REPLACE_OPTION, replaceAll=true)
	```

	where:
	<ul>
		<li>`filter` - a query filter object or `null` for no endpoint filtering</li>
		<li>`mergeOp` - one of `DEFAULTS_OPTION`, `MERGE_OPTION`, or `REPLACE_OPTION` and specifies
				how to combine an existing model with a matching ID with a newly retrieved model.</li>
		<li>`replaceAll` - a boolean where `true` means replace the current colleciton models with
				the returned models.</li>
	</ul>

	The `filter` parameter is a specialized object generated by the endpoint method `queryBuilder()`.
	A query builder is specialized to the endpoint and expose the following methods:

	<ul>
		<li>`equals(name, value)`</li>
		<li>`gt(name, value)`</li>
		<li>`gte(name, value)`</li>
		<li>`lt(name, value)`</li>
		<li>`lte(name, value)`</li>
	</ul>

	An example of using a query builder is:

	```
	const qb = colleciton.endpoint.queryBuilder();

	qb.equals("name", "fred");

	collection.fetch(qb);
	```

	<div data-ice="see"><h4>See:</h4>
		<ul>
			<li>{@link RestQueryBuilder}</li>
			<li>{@link PojoQueryBuilder}</li>
		</ul>
	</div>


	## Errors

	Methods utilizing the collection endpoint are asynchronous and return a `Promise`. Errors generated
	during an endpoint operation reject using an `Error` with several specialized properties:

	<ul>
		<li>`status` - an HTTP status code for the error type</li>
		<li>`endpointError` - the error object generated by the endpoint</li>
	</ul>


	## Auto-checkpointing

	The `Property` class supports checkpointing state that can be reset at a later time using
	{@link Property#resetToCheckpoint}. Collections support setting an 'auto-checkpoint' flag
	that will result in managed models automatically setting a checkpoint on change. This handy
	for situations like a 'Cancel' button on a form where all changes need to be undone. The
	checkpoints are automatically cleared when a model is saved.


	<ul>
		<li>`isAutocheckpoint()`</li>
		<li>`setAutocheckpoint(auto)`</li>
	</ul>


	## Middleware

	A middleware operation is invoked before each asynchronous/network operation involving the
	endpoint. Middleware operations are functions with the following format

	```
	function middleware(collectionShadow, collectionProperty, op): Promise
	```

	Middleware functions must return a `Promise` and are invoked in the order registered. A function
	generating an error will terminate the middleware chain and the collection operation will not
	be performed.

	<ul>
		<li>`CreateOp` - invoked prior to create rquests</li>
		<li>`DestroyOp` - invoked prior to destroy rquests</li>
		<li>`FetchOp` - invoked prior to fetch rquests</li>
		<li>`FindOp` - invoked prior to find rquests</li>
		<li>`UpdateOp` - invoked prior to update rquests</li>
		<li>`` - </li>
	</ul>


	## Events

	A colleciton is an [Event Emitter](https://github.com/component/emitter) and generates
	the following events:

	<ul>
		<li>`ChangeEvent` - collection changes</li>
		<li>`DeletedEvent` - collection destroy() success</li>
		<li>`FetchedEvent` - collection fetch() success</li>
		<li>`FoundEvent` - collection find() success</li>
		<li>`ErrorEvent` - error during an operation</li>
		<li>`SavedEvent` - collection save() success</li>
	</ul>

	Events are can be utilized to handle authorization errors, offline support, logging, or
	debugging tools.


	@see {@link CollectionShadow}
	@see {@link ShadowModelAccess}
	@see {@link RestEndpointProperty}
	@see {@link PojoEndpointProperty}
	@see {@link RestQueryBuilder}
	@see {@link PojoQueryBuilder}
*/
export default class CollectionProperty extends Property {
	constructor(stateType) {
		super(stateType);

		/** @ignore */
		this._keyed = new KeyedApi(this);

		this.setImplementationClass(ObjectShadowImpl);
		this.setShadowClass(CollectionShadow);

		/** @ignore */
		this[_middleware] = {
			[CreateOp]: [],
			[DestroyOp]: [],
			[FetchOp]: [],
			[FindOp]: [],
			[UpdateOp]: [],
		}

		// keep isFetching as an instance variable because transient data and gives immediate
		// feedback to prevent concurrent fetches
		/** @ignore */
		this[_fetching] = false;
		/** @ignore */
		this[_autocheckpoint] = false;

		this._keyed.addPropertyType(_idName, PrimitiveProperty.type.initialState("id").autoshadow);
		this._keyed.addProperty(_id2cid, new MapProperty());
		this._keyed.addPropertyType(_synced, PrimitiveProperty.type.initialState(false).autoshadowOff.readonly);

		// pagingTime instance variable used for ensuring overlapping paging requests do not mess up offset
		// this can happen when a paging request is in progress when limit is changed
		this.pagingTime = null;
		this._keyed.addPropertyType(_lastPageSize, PrimitiveProperty.type.initialState(null).autoshadowOff.readonly);
		this._keyed.addPropertyType(_limit, PrimitiveProperty.type.initialState(50).autoshadowOff.readonly);
		this._keyed.addPropertyType(_nextOffset, PrimitiveProperty.type.initialState(0).autoshadowOff.readonly);
		this._keyed.addPropertyType(_paging, PrimitiveProperty.type.initialState(false).autoshadowOff.readonly);

		// this._keyed.addPropertyType(_offlineKey, PrimitiveProperty.type.initialState(null).readonlyOff);
		// this._keyed.addPropertyType(_restored, PrimitiveProperty.type.initialState(false).autoshadowOff.readonly);

		// '_models' property contains ModelProperty objects which in turn keep their model state in
		// the 'data' whose type is specified by the stateType.getManagedType() value (default is
		// MapProperty.type)
		const models = new MapProperty();
		const modelsShader = models.shader();

		this._keyed.addProperty(_models, models);
		modelsShader.setElementType(ModelProperty.type);

		// set the type for each retrieved model by explicitly adding a type to the models element shader
		const managedType = this.stateType().getManagedType() || MapProperty.type;
		modelsShader.elementShader().addProperty("data", managedType);
	}

	/**
		Factory function for creating an `CollectionProperty` subclass. The generated class will have
		the `type` {@link StateType} descriptor set upon return.

		Example usage:
		```
		class SomeShadow extends CollectionShadow {
		    // definition here
		}

		export default CollectionProperty.createClass(SomeShadow, type => {
			// configure type variable
		});
		```

		@param {Object|CollectionShadow} [shadowType={}] - `Shadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state,
			or readonly.
		@param {Object} [initialState]={} - the initial state for the new property.

		@return {ObjectProperty} newly defined `ObjectProperty` subclass.
	*/
	static createClass(shadowType={}, typeCallback, initialState={}) {
		return createPropertyClass(shadowType, initialState, typeCallback, CollectionProperty, CollectionShadow);
	}

	/**
		Factory function for setting up the {@link StateType} `type` class variable with an appropriately
		configured intial state.

		Example usage:
		```
        export default class TodosCollection extends CollectionProperty {
			// implement property here
        }

        class TodosShadow extends CollectionShadow {
			// implement shadow api here
        }

        ObjectProperty.defineType(TodosCollection, TodosShadow, type => {
			// configure type variable
        });
		```

		@param {CollectionShadow} PropClass - `CollectionShadow` subclass
		@param {Object|CollectionShadow} [ShadowType] - Shadow` subclass or object literal api definition.
			If object literal specified, each property and function is mapped onto a Shadow subclass.
		@param {function(type: StateType)} [typeCallback] - a callback function that will be passed the
			{@link StateType} spec for additional customization, such as setting autoshadow, initial state, or
			readonly.
		@param {Object} [initialState={}] - the initial state for the new property.
	*/
	static defineType(PropClass, ShadowType, typeCallback, initialState={}) {
		assert( a => a.is(CollectionProperty.isPrototypeOf(PropClass), "PropClass must subclass CollectionProperty") );

		return StateType.defineTypeEx(PropClass, ShadowType, typeCallback, initialState);
	}

	/**
		Used by {@link StateType} to determine if a keyed property type.

		@ignore
	*/
	static supportsKeyedChildProperties() { return true }

	/**
		Override the base functionality method, and not designed life-cycle method propertyChildInvalidated(), so
		subclasses can do the normal override without using super.propertyWillUpdate() to preserve functionality.

		@ignore
	*/
	onChildInvalidated(childProperty, sourceProperty) {
		// need to call parent classes version
		super.onChildInvalidated(childProperty, sourceProperty);

		const childName = childProperty.name();

		if (childName === _models) {
			this.cancelRestore();
		}
	}

	/**
		Override the base functionality method, and not designed life-cycle method propertyWillUpdate(), so
		subclasses can do the normal override without using super.propertyWillUpdate() to preserve functionality.

		@ignore
	*/
	onPropertyDidShadow() {
		// need to call parent classes version
		super.onPropertyDidShadow();

		if (!this._().restored) {
			this.restore().catch( error => null );
		}
	}

	/**
		Override the base functionality method, and not designed life-cycle method propertyWillUpdate(), so
		subclasses can do the normal override without using super.propertyWillUpdate() to preserve functionality.

		@ignore
	*/
	onPropertyDidUpdate() {
		// need to call parent classes version
		super.onPropertyDidUpdate();

		this.storeData().catch( error => null );
		this.emit(ChangeEvent, this._(), this);
	}


	//------------------------------------------------------------------------------------------------------
	// Checkpoint support API
	//------------------------------------------------------------------------------------------------------


	/**
		Sets whether auto-checkpointing is enabled.

		@return {boolean}
	*/
	isAutocheckpoint() {
		return this[_autocheckpoint];
	}

	/**
		Sets whether auto-checkpointing should be enabled.

		@param {boolean} auto - `true` to enable.
	*/
	setAutocheckpoint(auto) {
		this[_autocheckpoint] = auto;
	}


	//------------------------------------------------------------------------------------------------------
	// Middleware API
	//------------------------------------------------------------------------------------------------------

	/**
		Registers collection middleware operation. A middleware operation is invoked before each asynchronous/
		network operation. Middleware operations are functions with the following format:

		```
		function mwCallback(collectionShadow, collectionProperty)
		```

		Middleware functions must return a promise and are invoked in the order registered. A function
		generating an error will terminate the middleware chain and the collection operation will not
		be performed.
	*/
	use(op, mw) {
		op = Array.isArray(op) ?op :[ op ];

		assert( a => { for (let i=0,len=op.length; i<len; i++) a.has(this[_middleware], op[i]) })

		for (let i=0, len=op.length; i<len; i++) {
			this[_middleware][op[i]].push(mw);
		}
	}

	/**
		Serially invokes each middleware function for the specified operation.

		@ignore
	*/
	_on(op, idx=0) {
		assert( a => a.is(this[_middleware][op], `Unknown middleware operation: ${op}`) );

		const mw = this[_middleware][op];
		const next = mw[idx];

		if (!next) {
			return Store.resolve(this._());
		}

		try {
			return next(this._(), this, op)
				.then( () => this._on(op, idx+1) );
		} catch(error) {
			return Store.reject(error);
		}
	}

	/**
		Experimental feature to update values with any modifications from the server.

		Question: should this be delegated to the endpoint?

		@experimental
		@ignore
	*/
	resync() {
		const values = this._().valuesArray();
		var currSync;
		var lastUpdate = null;
		var initialId = Number.MAX_SAFE_INTEGER;
		var filter, id, v, updatedAt;

		// Todo: break out filter parameters to a pluggable function
		// iterate all values and determine the greatest updated_at
		for (let i=0, len=values.length; i<len; i++) {
			v = values[i];

			if (!v) { continue }

			id = v.id;
			updatedAt = v.updated_at;

			if (id < initialId) {
				initialId = id;
			}

			if (!lastUpdate || lastUpdate < updatedAt) {
				lastUpdate = updatedAt;
			}
		}

		// setup the refresh criteria
		if (lastUpdate) {
			filter = this.endpoint.queryBuilder();

			filter.gte("initial_id", initialId);
			filter.gt("updated_at", lastUpdate);
		}

		debug( d => d(`resync() - path=${ this.dotPath() }, initial_id=${initialId}, updated_at=${lastUpdate}`) );

// Todo: rework network call to return two arrays: new/modified models and deleted model IDs
//       as currently structured there is no delete support.
//       What about dirty models? Perhaps they should not be touched if there is a conflict.

		return this.fetch(filter, MERGE_OPTION, !lastUpdate);
	}

	//------------------------------------------------------------------------------------------------------
	// Paging API (could improve by adding two offsets and maintain max pages)
	//------------------------------------------------------------------------------------------------------

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
		if (this.pagingTime) {
			throw new Error("Paging operation in progress");
		} else if (!this.hasMorePages()) {
			return Store.resolve(this._());
		}

		const filter = this.endpoint.queryBuilder();
		const time = this.pagingTime = Date.now();
		const replaceAll = !this._()[_nextOffset];

		this._keyed.set(_paging, true);

		filter.equals("offset", this._()[_nextOffset]);
		filter.equals("limit", this._()[_limit]);

		return this.fetch(filter, mergeOp, replaceAll, (error, models) => {
				// bail if paging times do not match (offset likely reset)
				if (time !== this.pagingTime) { return }

				this.pagingTime = null;
				this._keyed.set(_paging, false);
				if (error) { return }

				this._keyed.set(_nextOffset, this._()[_nextOffset] + models.length);
				this._keyed.set(_lastPageSize, models.length);

				if (models.length < this._()[_limit]) {
					this._keyed.set(_synced, true);
				}
			});
	}

	/**
		Gets if a paging operation ({@link CollectionProperty#fetchNext}) call is in progress.
	*/
	isPaging(state=this._()) {
		// use pagingTime instance variable (instant) and _paging state variable (tied to state) to
		// return the most conservative value
		return !!this.pagingTime || state[_paging];
	}

	/**
		Gets if additional paging calls will return additional results.
	*/
	hasMorePages(state=this._()) {
		return this.isConnected() &&
			!state[_synced] &&
			(state[_lastPageSize] == null || this._()[_lastPageSize] >= this._()[_limit]);
	}

	/**
		Gets the offset for the next paging request.
	*/
	nextOffset() {
		return this._keyed.get(_nextOffset);
	}

	/**
		Resets all internal paging tracking variables but does not affect currently stored models.
	*/
	resetPaging() {
		this.pagingTime = null;
		this._keyed.set(_lastPageSize, null);
		this._keyed.set(_nextOffset, 0);
		this._keyed.set(_paging, false);
	}

	/**
		Sets the number of models to request with each paging request. The default paging size is
		50.

		@param {number} limit
	*/
	setLimit(limit) {
		this.pagingTime = null;

		this._keyed.set(_limit, limit);
		this._keyed.set(_lastPageSize, null);
		this._keyed.set(_nextOffset, 0);
		this._keyed.set(_paging, false);
	}


	//------------------------------------------------------------------------------------------------------
	// Endpoint methods
	//------------------------------------------------------------------------------------------------------

	/**
		Gets the endpoint for accessing the remote data source.

		@return {Object}
	*/
	get endpoint() {
		return this.isActive() && this._()[_endpoint];
	}

	/**
		Gets the endpoint ID, which for {@link RestEndpointProperty} is its URL.

		@return {string}
	*/
	get endpointId() {
		const endpoint = this.endpoint;

		return endpoint && endpoint.id;
	}

	/**
		Removes the endpoint from the collection. This has the side-effect of clearing the mdoels.
	*/
	clearEndpoint() {
		this.removeAllModels();
		this.removeProperty(_endpoint);
	}

	/**
		Sets the {@link CollectionProperty#endpoint}.
	*/
	setEndpoint(endPoint) {
		const store = this.store();

		this.setFetching(false);
		this.resetPaging();
		this.removeAllModels();
		this._keyed.addProperty(_endpoint, endPoint);

		store && store.waitFor( () => this.restore().catch( error => null ) );
	}


	//------------------------------------------------------------------------------------------------------
	// Experimental offline support APIs
	//------------------------------------------------------------------------------------------------------

	/**
		Cancels outstanding data restoration from offline storage.
	*/
	cancelRestore() {
		if (this[_restoring]) {
			this[_restoring] = false;
			this.touch("CollectionProperty.cancelRestore()");
		}
	}

	/**
		Removes offline data for this collection.

		@experimental
	*/
	clearStoredData() {
		const epId = this.endpointId;
		const offlineKey = this._keyed.get(_offlineKey);
		const offline = this.store().offlineStore();
		const dataId = epId && encodeURIComponent(epId);

		if (dataId && offlineKey && offline) {
			return offline.setOfflineData(offlineKey, dataId, null);
		}
	}

	clearAllStoredData() {
		const offlineKey = this._keyed.get(_offlineKey);
		const offline = this.store().offlineStore();

		if (offlineKey && offline) {
			return offline.deleteBackups(offlineKey);
		}
	}

	/**
		Gets if the collection is in the process of restoring data from offline storage.
	*/
	isRestoring() {
		return this[_restoring];
	}

	/**
		Restores the collection to the last offline stored state. Method does not restore state if the
		collection contains any items or the `synced` flag is set.

		@return {Promise}

		@experimental
	*/
	restore() {
		if (!this.isActive()) { return Store.resolve(null) }

		const epId = this.endpointId;
		const offlineKey = this._keyed.get(_offlineKey);
		const synced = this._keyed.get(_synced);
		const offline = this.store().offlineStore();
		const dataId = encodeURIComponent(epId);

		// Must have an EP, offline data key, not synced, not restoring, and collection is empty
		if (!epId || !offlineKey || !offline || this.size || this.synced || this[_restoring]) {
			return Store.resolve(null)
		}

		this[_restoring] = true;
		this.touch("Collection[_restoring] = true");

		return offline.getOfflineData(offlineKey, dataId)
			.then( data => {
					const nextState = {
						...data.state,
						[_paging]: !!this.pagingTime, // could be a paging in process
						[_restored]: true,
						[_synced]: false
					};

					// ensure have data, same EP, still active, and collection is empty, versions match
					if (!data ||
						this.endpointId !== epId ||
						!this.isActive() ||
						this.size ||
						!this[_restoring] ||
						data.version !== SerializeVersion)
					{
						return this.cancelRestore();
					}

					// disable cancelRestore()
					this[_restoring] = false;

					this.update( state => {
							return {
								name: "restore()",
								nextState,
								replace: true
							};
						});

					// restore flag
					this[_restoring] = true;

					// reset flag after store updates state
					this.store().waitFor( () => this[_restoring] = false );

					return this.nextState();
				})
			.catch( error => {
				this[_restoring] = false;
				this.touch("Collection[_restoring] = false");

				debug( d => d(`Restore Error: ${error.message || error}`, error) );

				return Store.reject(error);
			})
	}

	/**
		Saves the current collection state for offline access. Method invoked on collection content changes.

		@return {Promise}

		@experimental
	*/
	storeData() {
		const state = this.state();
		const epId = this.endpointId;
		const offlineKey = this._keyed.get(_offlineKey);
		const offline = this.store().offlineStore();
		const dataId = epId && encodeURIComponent(epId);
		const canStore =
			dataId &&
			offlineKey &&
			offline &&
			(
				this.size ||
				state[_synced]
			)
		const data = {
			state,
			version: SerializeVersion
		}

		// Must have an EP, offline data key
		if (!canStore) { return Store.resolve(null) }

		return offline.setOfflineData(offlineKey, dataId, data, SerializeVersion)
			.then( () => {
					debug(`Collection backup successful - ${ this.collection.endpointId }, size=${this.size}`);

					return this;
				})
			.catch( error => {
					debug(`Collection backup error: collection=${ this.collection.endpointId }, error=${error}`);

					return Store.reject(error);
				});
	}


	//------------------------------------------------------------------------------------------------------
	// Collection methods
	//------------------------------------------------------------------------------------------------------

	/**
		Gets the number of models contained in the collection.
	*/
	get size() {
		return this.isActive() && this._().size;
	}

	/**
		Synchronously adds a new model object to the collection. Call `model.$().save()` to persist the newly
		added object.

		@param {object} state - the json model to add to the collection
		@param {string} [mergeOp=REPLACE_OPTION] - one of `DEFAULTS_OPTION`, `MERGE_OPTION`, or
			`REPLACE_OPTION` and specifies how to combine an existing model with a matching ID
			with a newly retrieved model.

		@return the object's ID. And ID is assigned if the 'id' parameter was not set and it could not
			be found in the `state` parameter.
	*/
	addModel(state, mergeOp=REPLACE_OPTION) {
		if (!this.isConnected()) { throw new Error(`Collection is not connected.`) }

		const id = this.extractId(state);
		var modelId;

		// just add the model
		if (!id || !this.hasModel(id) || mergeOp === REPLACE_OPTION) {
			let modelDefn = ModelProperty.modelDefinitionFor(state, this);
			let models = this._()[_models];

			models.set(modelDefn.cid, modelDefn);

			modelId = modelDefn.id;
		} else {
			let currModel = this._getModel(id);

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

	/**
		Bulk adds multiple models. Models must have an ID as it is assumed they have been previously
		saved.

		@param {array} models - array of model values
		@param {string} [mergeOp=REPLACE_OPTION] - one of `DEFAULTS_OPTION`, `MERGE_OPTION`, or
			`REPLACE_OPTION` and specifies how to combine an existing model with a matching ID
			with a newly retrieved model.
		@param {boolean} [syncOp=true] - sets the `synced` flag to true if this parameter is true
	*/
	addModels(models, mergeOp=REPLACE_OPTION, syncOp=true) {
		if (!this.isConnected()) { throw new(`Collection ${this.slashPath()} is not connected`) }

		var id, state;

		if (syncOp) {
			this._keyed.set(_synced, true);
		}

		for (let i=0, len=models.length; i<len; i++) {
			this.addModel(models[i], mergeOp);
		}
	}

	/**
		Combines an {@link CollectionProperty#add} and {@link CollectionProperty#save} actions.

		@param {Object} model - the json data

		@return {Promise} resolves with the f.lux shadow state for the new model
	*/
	create(model) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath()} is not connected`) }

		const cid = this.addModel(model);

		return this.store().waitThen()
			.then( () => this.save(cid) );
	}

	/**
		Permantently deletes the model with the endpoint and removes it from the collection.

		@param id - the model ID to delete

		@return {Promise} resolves with the ID for the removed mdoel
	*/
	destroy(id) {
		if (!this.hasModel(id)) {
			return Store.resolve(this._());
		}

		try {
			const model = this._getModel(id);
			const epId = this.endpointId;

			if (!model) {
				return Store.resolve(id);
			} else if (model.isNew()) {
				this._()[_models].delete(model.cid);
				this._()[_id2cid].delete(model.id);

				return Store.resolve(id);
			}

			return this._on(DestroyOp)
				.then( () => {
						model.waiting = true;

						return this.endpoint.doDelete(model.id)
					})
				.then( () => {
						// ensure endpoint did not change
						if (epId !== this.endpointId) { return id }

						this._()[_models].delete(model.cid);
						this._()[_id2cid].delete(model.id);

						this.store().waitFor( () => this.emit(DeletedEvent, this._(), this) )

						return id;
					})
				.catch( error => {
						const currModel = model.$().latest();

						if (currModel) {
							currModel.waiting = false
						}

						return this.onError(error, `Destroy model: ${id}`)
					});
		} catch(error) {
			return this.onError(error, `Destroy model: ${id}`);
		}
	}

	/**
		Fetches all the models from the endpoint.

		@param [filter=null] - filter object created using the endpoint.
		@param {string} [mergeOp=REPLACE_OPTION] - one of `DEFAULTS_OPTION`, `MERGE_OPTION`, or
			`REPLACE_OPTION` and specifies how to combine an existing model with a matching ID
			with a newly retrieved model.
		@param {boolean} [replaceAll=true] - set to `true` replace any current models by the ones
			returned by the endpoint.
		@param callback - invoked before retrieved models are process or in case of an error

		@return {Promise} resolves with the json models from the endpoint
	*/
	fetch(filter=null, mergeOp=REPLACE_OPTION, replaceAll=true, callback) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath()} is not connected`) }

		var syncOp = !filter;
		const epId = this.endpointId;

		if (replaceAll) {
			this.setFetching(true);
		}

		try {
			return this._on(FetchOp)
				.then( () => {
						// ensure endpoint did not change
						if (epId !== this.endpointId) { return null }

						return this.endpoint.doFetch(filter);
					})
				.then( models => {
						try {
							// bail on fetch if endpoint changed
							if (epId !== this.endpointId) {
								return models;
							}

							if (replaceAll) {
								this.setFetching(false);
							}

							// invoke the callback before processing models
							callback && callback(null, models);

							// callback could have changed the sync flag
							syncOp = syncOp || this.nextState()[_synced];

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
				.then( models => {
						// fire event if endpoint same
						if (epId === this.endpointId) {
							this.store().waitFor( () => this.emit(FetchedEvent, this._(), this) );
						}

						return models;
					})
				.catch( error => {
						// change fetching flag only if same endpoint
						if (replaceAll && epId === this.endpointId) {
							this.setFetching(false);
						}

						// invoke the callback with the error
						callback && callback(error, null);

						return this.onError(error, `Fetch all models`);
					});
		} catch(error) {
			if (replaceAll) {
				this.setFetching(false);
			}

			// invoke the callback with the error
			callback && callback(error, null);

			debug( d => d(`fetch() top level error: ${error.stack || error}`) );

			throw Store.reject(error);
		}
	}

	/**
		Gets a model by ID. The method looks for a matching model in the collection. If one
		is not found then one is requested from the endpoint.

		@param id - the model ID

		@return {Promise} reolves with the model or undefined if one is not found
	*/
	find(id) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath()} is not connected`) }

		try {
			const model = this._getModel(id);
			const epId = this.endpointId;

			if (model) {
				return Store.resolve(model.data);
			} else {
				return this._on(FindOp)
					.then( () => {
							// ensure endpoint did not change
							if (epId !== this.endpointId) { return null }

							return this.endpoint.doFind(id) ;
						})
					.then( state => {
							// ensure endpoint did not change
							if (epId !== this.endpointId) { return null }

							this.addModel(state, NONE_OPTION);
							this.store().waitFor( () => this.emit(FoundEvent, this._(), this) );

							return this.getModel(id);
						})
					.catch( error => this.onError(error, `Find model ${id}`) );
			}
		} catch(error) {
			return this.onError(error, `Find model ${id}`);
		}
	}

	/**
		Gets a model by ID. The method looks for a matching model in the collection and never
		looks for one remotely through the endpoint.

		@param id - the model ID

		@return {Object} the model or undefined if one is not found
	*/
	getModel(id) {
		const model = this._getModel(id);

		return model && model.data;
	}

	/**
		Gets if the collection contains a matching model.

		@param id - the model ID

		@return {boolean}
	*/
	hasModel(id) {
		const state = this._();

		return state[_id2cid].has(id) || state[_models].has(id);
	}

	/**
		Gets if the collection is active (has a shadow) and an endpoint.
	*/
	isConnected() {
		return this._() && this._()[_endpoint] && this._()[_endpoint].isConnected();
	}

	/**
		Gets if a fetching operation that will replace ALL models is in progress.
	*/
	isFetching() {
		return this[_fetching];
	}

	/**
		Gets if a model has never been persisted to the endpoint.
	*/
	isNew(id) {
		const model = this._getModel(id);

		return !model || model.isNew();
	}

	/**
		Gets if a model shadow state model represents a model that has never been persisted
		to the endpoint.
	*/
	isNewModel(shadow) {
		const id = this.extractId(shadow);

		return !id;
	}

	/**
		Gets the shadow models currently managed by the collection.

		@return {array} all models being managed by the collection
	*/
	modelsArray(state) {
		if (!state && !this.isConnected()) { throw new Error(`Collection is not connected.`) }

		state = state || this._();

		const models = state[_models];
		const keys = Object.keys(models);
		const result = [];

		for (let i=0, len=keys.length; i<len; i++) {
			result.push( models[keys[i]].data );
		}

		return result;
	}

	/**
		Gets an iterator with [ID, model] paris.

		@return {Array}
	*/
	modelEntries(state) {
		if (!state && !this.isActive()) { return doneIterator; }

		state = state || this._();

		const models = state[_models];
		const keys = this.modelKeysArray(state);

		return iterateOver(keys, key => [key, this.getModel(key)] );
	}

	/**
		Gets an iterator containing each model IDs.

		@return {Iterator}
	*/
	modelKeys(state=this._()) {
		// too brute force but quick and sure to work
		return iteratorFor(this.modelKeysArray(state));
	}

	/**
		Gets an array containing each model iDs.

		@return {Array}
	*/
	modelKeysArray(state) {
		if (!state && !this.isActive()) { return []; }

		state = state || this._();

		return Object.keys(state[_models]);
	}

	/**
		Gets an iterator containing each f.lux shadow state model.

		@return {Iterator}
	*/
	modelValues(state=this._()) {
		return iterateOver(this.modelKeysArray(state), key => this.getModel(key, state));
	}

	/**
		Synchronously removes the model from the collection without performing an endpoint operation.

		@param id - the model id or cid
	*/
	remove(id) {
		if (!this.hasModel(id)) { return }

		const model = this._getModel(id);
		const prevShadow = this._();

		this._()[_models].delete(model.cid);
		this._()[_id2cid].delete(model.id);
	}

	/**
		Removes all models from the collection and marks the collection as having not synched with the
		endpoint.
	*/
	removeAllModels() {
		if (!this.isActive()) { return }

		this._keyed.set(_restored, false);
		this._keyed.set(_synced, false);
		this._()[_models].clear();
		this._()[_id2cid].clear();
	}

	/**
		Saves a model through the endpoint.

		@param id - the model id or cid
		@param {string} [mergeOp=REPLACE_OPTION] - one of `DEFAULTS_OPTION`, `MERGE_OPTION`, or
			`REPLACE_OPTION` and specifies how to combine an existing model with a matching ID
			with a newly retrieved model.

		@return {Promise} resolves to the f.lux shadow state for the saved model
	*/
	save(id, mergeOp=MERGE_OPTION) {
		if (!this.isConnected()) { return Store.reject(`Collection ${this.slashPath()} is not connected`) }

		const model = this._getModel(id);
		const cid = model && model.cid;
		const shadow = model && model.data;

		if (!model) { return Store.reject(`Collection ${this.slashPath()} model not found: id=${id}`) }

		try {
			const shadowState = shadow.__().nextState();
			const opName = this.isNewModel(shadow) ?CreateOp :UpdateOp;
			const epId = this.endpointId;

			return this._on(opName)
				.then( () => {
						// ensure endpoint did not change
						if (epId !== this.endpointId) { return null }

						model.waiting = true;

						if (this.isNewModel(shadow)) {
							return this.endpoint.doCreate(shadow, shadowState);
						} else {
							return this.endpoint.doUpdate(model.id, shadow, shadowState);
						}
					})
				.then( savedState => {
						// ensure endpoint did not change
						if (epId !== this.endpointId) { return model }

						const currModel = model.$().latest();
						const savedId = this.extractId(savedState);

						currModel.waiting = false;

						// Put an entry in id->cid mapping
						if (savedId != id) {
							this._()[_id2cid].set(savedId, cid);
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
								currModel.defaults(savedState);
								break;
							default:
								return Store.reject(`Invalid post-save option: ${mergeOp}`);
						}

						currModel.$$().clearDirty();

						return this.store()
								.waitThen()
								.then( () => currModel.$().latest() );
					})
				.then( model => {
						// ensure endpoint did not change
						if (epId === this.endpointId) {
							Store.setTimeout( () => this.emit(SavedEvent, this._(), this) );
						}

						return model && model.data;
					})
				.catch( error => {
						let currModel = model.$().latest();

						if (currModel) {
							currModel.waiting = false
						}

						return this.onError(error, `Save ${id} - cid=${currModel.cid}`)
					});
		} catch(error) {
			return this.onError(error, `Save ${id} - cid=${model.cid}`);
		}
	}

	/**
		Sets the property name containing the model ID. Default is `id`.
	*/
	setIdName(idName) {
		this._()[_idName] = idName;
	}


	/**
		TODO: make private

		@ignore
	*/
	setFetching(fetching) {
		this[_fetching] = fetching;
		this.touch(`CollectionProperty.setFetching(${fetching})`);
	}

	/**
		Bulk replaces current models with an array of new models.

		@param {array} models - array of model values
		@param {boolean} [syncOp=true] - sets the `synced` flag to true if this parameter is true
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
		return `temp_${ uuid('_') }`;
	}

	/*
		Subclasses can override this method to remove underlying transport specific properties.
	*/
	clean(json) {
		return json;
	}

	/**
		Used by the private _shadow() method to get the id from the model JSON representation as returned by the
		subclass doXXX() apis. The default implementation simply returns the 'id' model property.
	*/
	extractId(model) {
		var idName = this._()[_idName];

		return isPlainObject(model)
			?model[idName]
			:model instanceof Shadow ?model.toJSON()[idName] :model;
	}

	/** @ignore */
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

		debug( d => d(`Error: ${msg}`, error) );

		const collectionError = new Error(msg);

		collectionError.status = error.status;
		collectionError.endpointError = error;

		this.emit(ErrorEvent, collectionError, this._(), this);

		return Store.reject(collectionError);
	}

	//------------------------------------------------------------------------------------------------------
	// Private methods
	//------------------------------------------------------------------------------------------------------

	/**
		Gets the Model container object NOT the actual model.

		@ignore
	*/
	_getModel(id) {
		const state = this._();
		const id2cid = state[_id2cid];
		var cid = id2cid.has(id) ?id2cid.get(id) :id;

		return state[_models].get(cid);
	}
}


StateType.defineType(CollectionProperty, spec => {
	spec.initialState({})
		.autoshadowOff
		.managedType(MapProperty.type)
		.properties({
			[_offlineKey]: PrimitiveProperty.type.initialState(null).readonlyOff,
			[_restored]: PrimitiveProperty.type.initialState(false).readonly,
		})
		.typeName("CollectionProperty");
});

// Mix in `Emitter`
Emitter(CollectionProperty.prototype);