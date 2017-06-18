import invariant from "invariant";

import { assert, isObject } from "akutils";


import ArrayProperty from "./MapProperty";
import IsolatedApi from "./IsolatedApi";
import MapProperty from "./MapProperty";
import Property from "./Property";
import ShadowImpl from "./ShadowImpl";
import Shader from "./Shader";
import tick from "./tick";
import TransientsProperty from "./TransientsProperty";

import appDebug, { StoreKey as DebugKey } from "./debug";
const debug = appDebug(DebugKey);


var _Promise = Promise;
var _clearInterval = clearInterval;
var _clearTimeout = clearTimeout;
var _setInterval = setInterval;
var _setTimeout = setTimeout;


const _transients = "__trans__";

/*
	Futures/Experiments:
		* Isolated objects - objects that can be referenced by properties within the shadow state without
			being explicitly mapped. Motivation: enable a Map interface to front a large number of
			objects without having to remap all properties with each contained object property change.
			Would be useful in efficiently implementing collections.
		* Use Proxy to replace ShadowImpl. Need to test performance first. Would remove many of the
			restrictions on using the shadow state, such as delete, unexpected property assignment.
*/

/**
	A f.lux based application uses a single store for managing all state. A `Store` instance is created
	by specifying a root {@link Property} and the initial state. The property must be a `Property` subclass
	and the state a json compatible value of appropriate type for the root `Property`. The store manages
	changes to the state through the shadow state. The shadow state proxies the actual state and each
	shadow state property is immutable and modifications to the shadow state, whether through function calls
	or direct assignment, are reflected asynchronously in the next javascript interpreter 'tick'.

	The `Store` class contains some advanced features useful for implementing complex business logic,
	loggers, and memory efficient master/detail user interfaces. Most of the time, however, your
	application will create a f.lux store and utilize the [f.lux-react](https://github.com/akrumel/f.lux-react)
	module for accessing the store's shadow state properties.

	## Subscribing to store changes

	Entities can subscribe to state changes resulting from actions on the shadow state. Subscription callbacks
	are registered/unregistered using the methods:

	<ul>
		<li>`subscribe(callback)` - adds a callback to the subscriber list</li>
		<li>`unsubscribe(callback)` - removes a callback from the subscriber list</li>
	</ul>

	The `callback` has the form:

	```
	callback(store, shadow, prevShadow)
	```


	## Update and wait

	Shadow state action changes to the actual state occur asynchronously. Usually, this works out
	well since your event and network processing will want to work with a single, consistent state. Certain
	situations occur where your code performs some actions on the shadow state and then needs to perform
	additional calculations/changes on the updated state. The f.lux store exposes several methods
	to make this process easy:

	<ul>
		<li>
			`updateNow(syncExec)` - performs any pending actions synchronously and then invokes the
				`syncExec` callback which does not take any parameters.
		</li>
		<li>
			`waitFor(callback)` - registers a **one-time** no argument callback to be invoked after the
				next state change.
		</li>
		<li>
			`waitThen()` - returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
				that will be resolved following the next state change.
		</li>
	</ul>


	## Transients

	F.lux store's transient objects are used for managing applications data that is used for short periods
	of time. Transients are expecially useful for implementing master/detail user interfaces. The master list
	is typically long lived while the detail records are rapidly inspected and discarded.

	Transient shadow objects are available through the {@link Store#transients`} method. The
	`transients` property is a {@link TransientShadow} exposes a `Map` interface for adding, accessing,
	and removing transient objects.

	The transient shadow properties are *swept* after each state change and non-locked properties are
	removed from the `transients` object relieving your code of the responsibility of proactively
	removing objects when no longer required.

	The normal flow of working with a transient is:

	<ol>
		<li>Create a `Property`</li>
		<li>Pick a transient object ID (`transId`)</li>
		<li>Obtain `Store.transients`</li>
		<li>`var trans = transients.set(transId, property)` - returns a `TransientProperty`</li>
		<li>Do somethings with the transient object: `trans.data()`</li>
		<li>`trans.lock()`</li>
		<li>`trans.unlock(transId</li>
	</ol>

	The `f.lux-react` module contains the `TransientManager` class that is useful for managing
	transient data in a React component.

	<div data-ice="see"><h4>See:</h4>
		<ul>
			<li>
				<a href=https://github.com/akrumel/f.lux-react/blob/master/src/TransientManager.js>
					TransientManager
				</a>
			</li>
			<li>{@link Store#transients}</li>
			<li>{@link TransientsProperty}</li>
			<li>{@link TransientProperty}</li>
		</ul>
	</div>


	## Listener API

	The `Store` class exposes a listener api for monitoring state changes. The f.lux module ships with
	one listener called {@link Logger} that tracks state changes and provides time travel debugging. A
	listener is registered/unregsitered using:

	<ul>
		<li>{@link Store#addListener}</li>
		<li>{@link Store#removeListener}</li>
	</ul>

	Where the `listener` parameter is an object that can implement the following methos:

	<ul>
		<li>`onError(msg, error)` - an error occurred during a `Store` operation</li>
		<li>`onPreStateUpdate(action, impl)` - invoked before a shadow property executes an action</li>
		<li>`onPostStateUpdate(action, impl)` - invoked after a shadow property executes an action</li>
		<li>`onPreUpdate(currState, time)` - invoked before the store's state is updated</li>
		<li>`onPostUpdate(time, currState, prevState)` - invoked after the store's state is updated</li>
	</ul>

	<div data-ice="see"><h4>See:</h4>
		<ul>
			<li>{@link Logger}</li>
		</ul>
	</div>


	## Promise and timers

	Some environments require special handling for timers, such as
	[React Native](https://facebook.github.io/react-native/docs/timers.html). Additionally, developers
	may desire to utilize specific
	[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
	libraries in order to take advantage of specialized features. The `Store` class provides methods for
	setting the timer functions and `Promise` module to be utilized by f.lux.

	<div data-ice="see"><h4>See:</h4>
		<ul>
			<li>{@link Store.setPromise}</li>
			<li>{@link Store.setTick}</li>
			<li>{@link Store.getPromise}</li>
			<li>{@link Store.clearInterval}</li>
			<li>{@link Store.clearTimeout}</li>
			<li>{@link Store.setInterval}</li>
			<li>{@link Store.setTimeout}</li>
			<li>{@link Store.all}</li>
			<li>{@link Store.promise}</li>
			<li>{@link Store.reject}</li>
			<li>{@link Store.resolve}</li>
		</ul>
	</div>
*/

export default class Store {
	/**
		Creates a new f.lux store for managing the application state.

		@param {Property} root - the top-level `Property` used to shadow the application state
		@param {Object|Array} [state=root.initialState()] - the initial application state
		@param {boolean} [useTransients=false] - `true` to enable transient state
	*/
	constructor(root, state, useTransients=false, offline=null) {
		invariant(root instanceof Property || Array.isArray(root) || isObject(root),
			"Store root must be one of: Property subclass, object, or array");

		// ensure root
		if (!(root instanceof Property)) {
			state = root;

			root = Array.isArray() ?new ArrayProperty() :new MapProperty();
		} else if (state === undefined) {
			state = root.initialState();
		}

		this._isolated = new IsolatedApi(this);
		this._listeners = [];
		this._subscribers = [];
		this._useTransients = useTransients;
		this._offlineStore = offline;

		// dispatcher queues for pending actions and waitFor() requests
		this._updateAction = null;
		this._waitFor = [];

		if (root) {
			this.setRootProperty(root, state);
		}
	}

	/**
		Gets the {@link OfflineDataStore} used by properties to work offline.

		@return {OfflineDataStore}

		@experimantal
	*/
	offlineStore() {
		return this._offlineStore;
	}

	/**
		Gets the {@link OfflineDataStore} used by properties to work offline.

		@param {OfflineDataStore} - the shared offline storage instance

		@experimantal
	*/
	setOfflineStore(offline) {
		this._offlineStore = offline;
	}

	/**
		Adds a callback to be invoked after each application state change. The `callback` has the form:
		```
		callback(store, shadow, prevShadow)
		```

		@param {function(store: Store, shadow: Shadow, prevShadow: Shadow)} callback - called after each
			state update
	*/
	subscribe(callback) {
		assert( a => a.is(typeof callback === 'function', "Callback must be a function") );

		if (typeof callback === 'function') {
			this._subscribers.push(callback);
		}
	}

	/**
		Removes a callback to be invoked after each state change.
	*/
	unsubscribe(callback) {
		this._subscribers = this._subscribers.filter( s => s != callback );
	}

	//******************************************************************************************************************
	//  Properties and methods dealing with state
	//******************************************************************************************************************

	/**
		Alias for top-level shadow property.

		@see Store#shadow
	*/
	get _() {
		return this._root._();
	}

	/**
		Alias for rootImpl property.

		@see Store#rootImpl
	*/
	get __() {
		return this.rootImpl;
	}

	/**
		Gets the top-level `Property` used for shadowing the application state.

		@return {Property}

		@see Store#state
	*/
	get root() {
		return this._root;
	}

	/**
		Gets the {@link ShadowImpl} backing the {@link Store#shadow}.

		@return {ShadowImpl}
	*/
	get rootImpl() {
		return this._rootImpl || this._root.__();
	}

	/**
		Gets the current f.lux shadow state.

		@return {Shadow}
	*/
	get shadow() {
		return this._root._();
	}

	/**
		Gets the current, actual application state.

		@return {Object|Array}
	*/
	get state() {
		return this._state;
	}

	/**
		Gets the `transients` objects

		@return {TransientsShadow}
	*/
	get transients() {
		return this.shadow[_transients];
	}

	/**
		@ignore
	*/
	get updateTime() {
		return this._updateTime;
	}

	/**
		Set a new value for the application state. This will totally replace the current state and trigger
		a reshadowing. The root `Property` instance will be reused.

		This method is used by {@link Logger} to implement time travel debugging.

		@param {Object|Array} state - the new application state
		@param {boolean} [newRoot=false] - `true` if the state object represents an entirely new state.
			`false` implies the root object is the same but child properties have been updated.
		@param {number} [time=tick()] - the f.lux time for the change.
	*/
	changeState(state, newRoot=false, time=tick()) {
		this._updateTime = time;

		// all pending callbacks are obsolete now
		this._clearCallbacks();

		// invoke will shadow/update lifecycle methods
		if (this._rootImpl && this._state) {
			this._rootImpl.willShadow(newRoot);
		}

		this._isolated.reset();

		// proxy/shadow the state
		this._rootImpl = this._root.shader(state).shadowProperty(time, "/", state);

		// get the final state after merging any property initial states
		this._state = this._rootImpl.state();

		// invoke did shadow/update lifecycle methods
		this._rootImpl.didShadow(time, newRoot);

		this._notifySubscribers();
	}

	/**
		Gets the shadow state property based on array of property keys.

		@param {Array} path - array of property keys from the root to the desired property.

		@return {Shadow} the shadow state property if property exists.
	*/
	findByPath(path) {
		const rootImpl = this._root.__();
		const impl = rootImpl.findByPath(path);

		return impl && impl._();
	}

	/**
		Gets the Property based on array of property keys.

		@param {Array} path - array of property keys from the root to the desired property.

		@return {Property} the Property if exists.
	*/
	findPropertyByPath(path) {
		const rootImpl = this._root.__();
		const impl = rootImpl.findByPath(path);

		return impl && impl.property();
	}

	isolated() {
		return this._isolated;
	}

	/**
		Changes the top-level `Property` and application state.

		@param {Property} root - the top-level `Property` used to shadow the application state
		@param {Object|Array} [state=root.initialState()] - the initial application state
	*/
	setRootProperty(root, state=root.initialState()) {
		if (!(root instanceof Property)) {
			throw new Error("Root property must be a Property instance");
		}

		const currRoot = this._root;
		const currRootActive = currRoot && currRoot.isActive();

		// inform property it is being replaced
		if (currRoot && root !== currRoot && currRootActive) {
			currRoot.__().obsoleteTree( impl => {
				// set the root property and set it's store to this object
				root.setStore(this);
				this._root = root;

				this.changeState(state, true);
			});
		} else {
			// set the root property and set it's store to this object
			if (root !== currRoot) {
				root.setStore(this);
				this._root = root;
			}

			this.changeState(state, root !== currRoot);
			this._setupTransients();
		}
	}

	//******************************************************************************************************************
	//  Listeners methods
	//******************************************************************************************************************

	/** @ignore */
	onError(msg, error) {
		const listeners = this._listeners;

		for (let i=0, l; l = listeners[i]; i++) {
			if (l.onError) {
				l.onError(this, msg, error);
			}
		}
	}

	/** @ignore */
	onPreStateUpdate(action, impl) {
		const listeners = this._listeners;

		for (let i=0, l; l = listeners[i]; i++) {
			if (l.onPreStateUpdate) {
				l.onPreStateUpdate(this, action, impl);
			}
		}
	}

	/** @ignore */
	onPostStateUpdate(action, impl) {
		const listeners = this._listeners;

		for (let i=0, l; l = listeners[i]; i++) {
			if (l.onPostStateUpdate) {
				l.onPostStateUpdate(this, action, impl);
			}
		}
	}

	/** @ignore */
	onPreUpdate(currState, time) {
		const listeners = this._listeners;

		for (let i=0, l; l = listeners[i]; i++) {
			if (l.onPreUpdate) {
				l.onPreUpdate(this, currState, time);
			}
		}
	}

	/** @ignore */
	onPostUpdate(time, currState, prevState) {
		if (this._listeners.length === 0) { return }

		const listeners = this._listeners;
		const isoState = this._isolated.serialize();

		for (let i=0, l; l = listeners[i]; i++) {
			if (l.onPostUpdate) {
				l.onPostUpdate(this, time, currState, prevState, isoState);
			}
		}
	}

	/**
		Adds a listener object to monitor state changes. A `listener` is an object that can
		implement the following methos:

		<ul>
			<li>`onError(msg, error)` - an error occurred during a `Store` operation</li>
			<li>`onPreStateUpdate(action, impl)` - invoked before a shadow property executes an action</li>
			<li>`onPostStateUpdate(action, impl)` - invoked after a shadow property executes an action</li>
			<li>`onPreUpdate(currState, time)` - invoked before the store's state is updated</li>
			<li>`onPostUpdate(time, currState, prevState)` - invoked after the store's state is updated</li>
		</ul>

		@param {Object} listener - object with methods to be invoked on state changes.

		@see Logger
	*/
	addListener(listener) {
		this._listeners.push(listener);
	}

	/**
		Removes a listener object from monitoring state changes.
	*/
	removeListener(listener) {
		var idx;

		while((idx = this._listeners.indexOf(listener)) != -1) {
			this._listeners.splice(idx, 1);
		}
	}


	//******************************************************************************************************************
	//  Store state update related methods
	//******************************************************************************************************************

	/**
		Schedules an action to update the application state. This method is utilized by root {@link ShadowImpl} to
		trigger the reshadow process and custom properties, listeners, and application logic should never need to
		explicitly invoke it.

		@param {function(time: number)} action - the callback will normally trigger a reshadow.

		@throws {Error} f.lux store already scheduled to perform an update.
	*/
	dispatchUpdate(action) {
		if (this._updateAction) {
			throw new Error("Pending action already waiting for dispatch");
		}

		this._updateAction = action;

		this.schedule();
	}

	/**
		Gets if an update action has been registered with the store.

		@return {boolean}
	*/
	isScheduled() {
		return !!this._updateAction;
	}

	/**
		Schedules pending tasks to execute. This method should not need to be called by code external to the class.
	*/
	schedule() {
		// Nothing to do if no registered pendingActions
		if (!this._updateAction && !this._waitFor.length) { return; }

		_setTimeout( () => this._exec() )
	}

	// obsolete (2/14/17)
	// update(callback) {
	// 	invariant(callback, "Store.update() requires a callback function");

	// 	callback();

	// 	this._exec();
	// }

	/**
		Executes all pending updates and waitFor() requests synchronously (immediately) and then invokes
		an optional callback once the shadow state is updated.

		This method is useful when custom properties change the shadow state and need these changes
		to be reflected before performing additional processing.

		@param {function()} syncExec - a callback to be invoked after all pending changes have been
			reflected in the shadow state.
	*/
	updateNow(syncExec) {
		this._exec();

		if (syncExec && syncExec()) {
			this._exec();
		}
	}

	/**
		Registers a **one-time** no argument callback to be invoked after the next state change.

		@param {function()} callback - a callback to be invoked after all pending changes have been
			reflected in the shadow state.
	*/
	waitFor(callback) {
		assert( a => a.is(typeof callback === 'function', "Callback must be a function") );

		if (typeof callback === 'function') {
			this._waitFor.push(callback);

			this.schedule();
		}
	}

	/**
		Returns a `Promise` that is resolved following the next state change.

		@return {Promise}
	*/
	waitThen() {
		return new Promise( (resolve, reject) => {
			this.waitFor(resolve);
		})
	}


	//******************************************************************************************************************
	//  Promise and timer setup methods
	//******************************************************************************************************************

	static getPromise() {
		return _Promise;
	}

	static setPromise(promise) {
		_Promise = promise
	}

	static setTick(ticker) {
		_clearInterval = ticker.clearInterval;
		_clearTimeout = ticker.clearTimeout;
		_setInterval = ticker.setInterval;
		_setTimeout = ticker.setTimeout;
	}

	//******************************************************************************************************************
	//  Promise and timer convenience methods
	//******************************************************************************************************************

	static clearInterval(intervalId) {
		return _clearInterval(intervalId);
	}

	static clearTimeout(timerId) {
		return _clearTimeout(timerId);
	}

	static setInterval(callback, time, ...params) {
		return _setInterval(callback, time, ...params);
	}

	static setTimeout(callback, time, ...params) {
		return _setTimeout(callback, time, ...params);
	}

	static all(promises) {
		return _Promise.all(promises);
	}

	static promise(callback) {
		return new _Promise(callback)
	}

	static reject(error) {
		return _Promise.reject(error);
	}

	static resolve(...params) {
		return _Promise.resolve.call(_Promise, ...params);
	}

	/** @ignore */
	_clearCallbacks() {
		// clear callback data structures
		this._updateAction = null;
		this._waitFor = [];
	}

	/** @ignore */
	_exec() {
		const updateAction = this._updateAction;
		const waitFor = this._waitFor;
		const prevShadow = this.shadow;

		// Reset the pending actions
		this._updateAction = null;
		this._waitFor = [];

		if (updateAction) {
			if (this._updating) {
				debugger
				throw new Error("Already updating state - use store.waitFor()");
			}

			try {
				this._updating = true;

				const currState = this._state;
				const time = this._updateTime = tick();

				// inform middleware going to perform an update
				this.onPreUpdate(currState, time);

				this._rootImpl.willShadow(false);

				// perform the update action
				const impl = updateAction(time);

				if (!(impl instanceof ShadowImpl)) {
					this._onError("Property update action did not return a ShadowImpl type");
				} else if (impl.property() != this._root) {
					this._onError("Property update action cannot replace the root state");
				} else {
					this._rootImpl = impl;
					this._state = impl.state();

					// Have each property invoke did shadow/update lifecycle methods now that store is coherent with new stat
					this._rootImpl.didShadow(time, false);
				}

				// inform middleware update completed
				this.onPostUpdate(time, this._state, currState);
			} catch(error) {
				this._onError(`State dispatch UPDATE action exception: ${error}`, error);
			} finally {
				this._updating = false;
			}
		}

		this._notifyWaitFors(waitFor);
		this._notifySubscribers(prevShadow);
		this._sweepTransients();
	}

	/** @ignore */
	_notifySubscribers(prevShadow) {
		// Iterate each subscriber
		for (let i=0, subscriber; subscriber = this._subscribers[i]; i++) {
			try {
				subscriber(this, this.shadow, prevShadow);
			} catch(error) {
				this._onError(`Store subscriber notification caused an exception: ${error}`, error);
			}
		}
	}

	/** @ignore */
	_notifyWaitFors(waitFor) {
		// Iterate each waitFor request
		for (let i=0, waiting; waiting = waitFor[i]; i++) {
			try {
				waiting();
			} catch(error) {
				this._onError(`Store dispatch waitFor() request exception: ${error}`, error);
			}
		}
	}

	/** @ignore */
	_onError(msg, error) {
		debug( d => d(`Store error: ${msg}`, error) );

		if (process.env.NODE_ENV !== 'production') {
			console.warn("f.lux Store Error", error.stack || error);
		}

		this.onError(msg, error);
	}

	/** @ignore */
	_setupTransients() {
		const root = this._root;
		const rootShader = root.shader();
		const keyedApi = root._keyed ?root._keyed :root;

		if (keyedApi && this._useTransients && !rootShader.has(_transients)) {
			keyedApi.addProperty(_transients, new TransientsProperty());
		}
	}

	/** @ignore */
	_sweepTransients() {
		const trans = this.shadow[_transients];

		if (trans) {
			trans.sweep();
		}
	}
}
