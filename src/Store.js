import invariant from "invariant";

import { assert, isObject } from "akutils";


import ArrayProperty from "./MapProperty";
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


/**
	A f.lux based application uses a single store for managing all state. A `Store` instance is created
	by specifying a root property and the initial state. The property must be a `Property` subclass and
	the state a json compatible value of appropriate type for the root `Property`. The store manages
	changes to the state through the shadow state. The shadow state mirrors the actual state and each
	shadow state property is immutable and modifications to the shadow state, whether through function calls
	or direct assignment, are reflected asynchronously in the next javascript interpreter 'tick'.


	## Subscribing to store changes

	You application can subscribe to the store to be notified each time the state changes through
	actions on the shadow state. Subscription callbacks are registered/unregistered using the methods:

	<ul>
		<li>`subscribe(callback)` - adds a callback to the subscriber list</li>
		<li>`unsubscribe(callback)` - removes a callback from the subscriber list</li>
	</ul>

	The `callback` has the form:

	```
	callback(store, shadow, prevShadow)
	```


	## Update and wait

	Actions resulting from shadow state changes are reflected asynchronously. Usually, this works out
	well since your event and network processing will want to work with a single, consistent state. But
	sometime your code will need to make perform some actions and then need the changes to be reflected
	before performing additional calculations or observations. The `Store` class exposes several methods
	to make this process straight-forward:

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

	Certain types of applications involve rapid inspection of master/detail records. This can quickly
	generate many objects that can result in large, complex lists if all objects are kept in memory.
	The `Store` class implements a concept called *transients* to easily manage such objects.

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

	@see {@link Store#transients}
	@see {@link TransientsProperty}
	@see {@link TransientProperty}
	@see https://github.com/akrumel/f.lux-react/blob/master/src/TransientManager.js


	## Listener API

	The `Store` class exposes a listener api for monitoring state changes. The f.lux module ships with
	one listener called {@link Logger} that tracks state changes and provides time travel debugging. A
	listener is registered/unregsitered using:

	<ul>
		<li>`addListener(listener)`</li>
		<li>`removeListener(listener)`</li>
	</ul>

	Where the `listener` parameter is an object that can implement the following methos:

	<ul>
		<li>`onError(msg, error)` - an error occurred during a `Store` operation</li>
		<li>`onPreStateUpdate(action, impl)` - invoked before a shadow property executes an action</li>
		<li>`onPostStateUpdate(action, impl)` - invoked after a shadow property executes an action</li>
		<li>`onPreUpdate(currState, time)` - invoked before the store's state is updated</li>
		<li>`onPostUpdate(time, currState, prevState)` - invoked after the store's state is updated</li>
	</ul>

	@see {@link Logger}
*/
export default class Store {
	constructor(root, state, useTransients=true) {
		invariant(root instanceof Property || Array.isArray(root) || isObject(root),
			"Store root must be one of: Property subclass, object, or array");

		// ensure root
		if (!(root instanceof Property)) {
			state = root;

			root = Array.isArray() ?new ArrayProperty() :new MapProperty();
		} else if (state === undefined) {
			state = root.initialState();
		}

		this._useTransients = useTransients;
		this._subscribers = [];
		this._listeners = [];

		// dispatcher queues for pending actions and waitFor() requests
		this._updateAction = null;
		this._waitFor = [];

		if (root) {
			this.setRootProperty(root, state);
		}
	}

	subscribe(callback) {
		assert( a => a.is(typeof callback === 'function', "Callback must be a function") );

		if (typeof callback === 'function') {
			this._subscribers.push(callback);
		}
	}

	unsubscribe(callback) {
		this._subscribers = this._subscribers.filter( s => s != callback );
	}

	//******************************************************************************************************************
	//  Properties and methods dealing with state
	//******************************************************************************************************************

	/**
		Alias for shadow property.
	*/
	get _() {
		return this._root._();
	}

	/**
		Alias for rootImpl property.
	*/
	get __() {
		return this._rootImpl;
	}

	get root() {
		return this._root;
	}

	get rootImpl() {
		return this._rootImpl;
	}

	get shadow() {
		return this._root._();
	}

	get state() {
		return this._state;
	}

	get transients() {
		return this.shadow[_transients];
	}

	get updateTime() {
		return this._updateTime;
	}

	/**
		Change the store's state. This will trigger totally replace the current state and trigger
		a reshadowing. The root Property instance will be reused.
	*/
	changeState(state, newRoot=false, time=tick()) {
		this._updateTime = time;

		// all pending callbacks are obsolete now
		this.clearCallbacks();

		// invoke will shadow/update lifecycle methods
		if (this._rootImpl && this._state) {
			this._rootImpl.willShadow(newRoot);
		}

		// proxy/shadow the state
		this._rootImpl = this._root.shader(state).shadowProperty(time, "/", state);

		// get the final state after merging any property initial states
		this._state = this._rootImpl.state();

		// invoke did shadow/update lifecycle methods
		this._rootImpl.didShadow(time, newRoot);

		this._notifySubscribers();
	}

	clearCallbacks() {
		// clear callback data structures
		this._updateAction = null;
		this._waitFor = [];
	}

	findByPath(path) {
		const rootImpl = this._root.__();

		return rootImpl.findByPath(path);
	}

	setRootProperty(root, state=null) {
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

			this._setupTransients();
			this.changeState(state, root !== currRoot);
		}
	}

	//******************************************************************************************************************
	//  Listeners methods
	//******************************************************************************************************************

	onError(msg, error) {
		const listeners = this._listeners;

		for (let i=0, l; l = listeners[i]; i++) {
			if (l.onError) {
				l.onError(this, msg, error);
			}
		}
	}

	onPreStateUpdate(action, impl) {
		const listeners = this._listeners;

		for (let i=0, l; l = listeners[i]; i++) {
			if (l.onPreStateUpdate) {
				l.onPreStateUpdate(this, action, impl);
			}
		}
	}

	onPostStateUpdate(action, impl) {
		const listeners = this._listeners;

		for (let i=0, l; l = listeners[i]; i++) {
			if (l.onPostStateUpdate) {
				l.onPostStateUpdate(this, action, impl);
			}
		}
	}

	onPreUpdate(currState, time) {
		const listeners = this._listeners;

		for (let i=0, l; l = listeners[i]; i++) {
			if (l.onPreUpdate) {
				l.onPreUpdate(this, currState, time);
			}
		}
	}

	onPostUpdate(time, currState, prevState) {
		const listeners = this._listeners;

		for (let i=0, l; l = listeners[i]; i++) {
			if (l.onPostUpdate) {
				l.onPostUpdate(this, time, currState, prevState);
			}
		}
	}

	addListener(listener) {
		this._listeners.push(listener);
	}

	removeListener(listener) {
		var idx;

		while((idx = this._listeners.indexOf(listener)) != -1) {
			this._listeners.splice(idx, 1);
		}
	}


	//******************************************************************************************************************
	//  Store state update related methods
	//******************************************************************************************************************

	dispatchUpdate(action) {
		if (this._updateAction) {
			throw new Error("Pending action already waiting for dispatch");
		}

		this._updateAction = action;

		this.schedule();
	}

	/**
		Schedules pending tasks to execute. This method should not need to be called by code external to the class.
	*/
	schedule() {
		// Nothing to do if no registered pendingActions
		if (!this._updateAction && !this._waitFor.length) { return; }

		_setTimeout( () => this._exec() )
	}

	update(callback) {
		invariant(callback, "Store.update() requires a callback function");

		callback();

		this._exec();
	}

	/**
		Executes all pending updates and waitFor() requests synchronously.
	*/
	updateNow(syncExec) {
		this._exec();

		if (syncExec && syncExec()) {
			this._exec();
		}
	}

	waitFor(callback) {
		assert( a => a.is(typeof callback === 'function', "Callback must be a function") );

		if (typeof callback === 'function') {
			this._waitFor.push(callback);

			this.schedule();
		}
	}

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
		_clearTimeout = ticker.clearTimeou;
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
	}

	_notifySubscribers(prevShadow) {
		// Iterate each subscriber
		for (let i=0, subscriber; subscriber = this._subscribers[i]; i++) {
			try {
				subscriber(this, shadow, prevShadow);
			} catch(error) {
				this._onError(`Store subscriber notification caused an exception: ${error}`, error);
			}
		}
	}

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

	_onError(msg, error) {
		debug( d => d(`Store error: ${msg}`, error) );

		if (process.env.NODE_ENV !== 'production') {
			console.warn("f.lux Store Error", error.stack || error);
		}

		this.onError(msg, error);
	}

	_setupTransients() {
		const root = this._root;
		const rootShader = root.shader();
		const keyedApi = root._keyed ?root._keyed :root;

		if (keyedApi && this._useTransients && !rootShader.has(_transients)) {
			keyedApi.addProperty(_transients, new TransientsProperty());
		}
	}

	_sweepTransients() {
		const trans = this.shadow[_transients];

		if (trans) {
			trans.sweep();
		}
	}
}
