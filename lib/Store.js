"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isObject = require("./utils/isObject");

var _isObject2 = _interopRequireDefault(_isObject);

var _KeyedProperty = require("./KeyedProperty");

var _KeyedProperty2 = _interopRequireDefault(_KeyedProperty);

var _MapProperty = require("./MapProperty");

var _MapProperty2 = _interopRequireDefault(_MapProperty);

var _Property = require("./Property");

var _Property2 = _interopRequireDefault(_Property);

var _ShadowImpl = require("./ShadowImpl");

var _ShadowImpl2 = _interopRequireDefault(_ShadowImpl);

var _Shader = require("./Shader");

var _Shader2 = _interopRequireDefault(_Shader);

var _tick = require("./tick");

var _tick2 = _interopRequireDefault(_tick);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _Promise = Promise;
var _clearInterval = clearInterval;
var _clearTimeout = clearTimeout;
var _setInterval = setInterval;
var _setTimeout = setTimeout;

/*

*/

var Store = function () {
	function Store() {
		var root = arguments.length <= 0 || arguments[0] === undefined ? new _MapProperty2.default() : arguments[0];
		var state = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

		_classCallCheck(this, Store);

		this._subscribers = [];
		this._listeners = [];

		// dispatcher queues for pending actions and waitFor() requests
		this._updateAction = null;
		this._waitFor = [];

		if (root) {
			this.setRootProperty(root, state);
		}
	}

	_createClass(Store, [{
		key: "subscribe",
		value: function subscribe(callback) {
			this._subscribers.push(callback);
		}
	}, {
		key: "unsubscribe",
		value: function unsubscribe(callback) {
			this._subscribers = this._subscribers.filter(function (s) {
				return s != callback;
			});
		}

		//******************************************************************************************************************
		//  Properties and methods dealing with state
		//******************************************************************************************************************

	}, {
		key: "changeState",
		value: function changeState(state) {
			var newRoot = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
			var time = arguments.length <= 2 || arguments[2] === undefined ? (0, _tick2.default)() : arguments[2];

			this._updateTime = time;

			// all pending callbacks are obsolete now
			this.clearCallbacks();

			// Have each property invoke will shadow/update lifecycle methods
			if (this._rootImpl && this._state) {
				this._rootImpl.willShadow(newRoot);
			}

			// initialize state
			this._rootImpl = this._root.shader(state).shadowProperty(time, "/", state);

			// get the final state after merging any property initial states
			this._state = this._rootImpl.state;

			// Have each property invoke did shadow/update lifecycle methods
			this._rootImpl.didShadow(time, newRoot);

			this._notifySubscribers();
		}
	}, {
		key: "clearCallbacks",
		value: function clearCallbacks() {
			// clear callback data structures
			this._updateAction = null;
			this._waitFor = [];
		}
	}, {
		key: "findByPath",
		value: function findByPath(path) {
			var rootImpl = this._root.__;

			return rootImpl.findByPath(path);
		}
	}, {
		key: "setRootProperty",
		value: function setRootProperty(root) {
			var _this = this;

			var state = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

			if (!(root instanceof _Property2.default)) {
				throw new Error("Root property must be a Property instance");
			}

			var currRoot = this._root;
			var currRootActive = currRoot && currRoot.isActive();

			// inform property it is being replaced
			if (currRoot && root != currRoot && currRootActive) {
				currRoot.__.obsoleteTree(function (impl) {
					// set the root property and set it's store to this object
					root.setStore(_this);
					_this._root = root;

					_this.changeState(state, true);
				});
			} else {
				// set the root property and set it's store to this object
				if (root != currRoot) {
					root.setStore(this);
					this._root = root;
				}

				this.changeState(state, root != currRoot);
			}
		}
	}, {
		key: "setRootJson",
		value: function setRootJson(json, auto) {
			this.setRootProperty(new ObjectProperty(json, auto));
		}

		//******************************************************************************************************************
		//  Listeners methods
		//******************************************************************************************************************

	}, {
		key: "onError",
		value: function onError(msg, error) {
			var listeners = this._listeners;

			for (var i = 0, l; l = listeners[i]; i++) {
				if (l.onError) {
					l.onError(this, msg, error);
				}
			}
		}
	}, {
		key: "onPreStateUpdate",
		value: function onPreStateUpdate(action, impl) {
			var listeners = this._listeners;

			for (var i = 0, l; l = listeners[i]; i++) {
				if (l.onPreStateUpdate) {
					l.onPreStateUpdate(this, action, impl);
				}
			}
		}
	}, {
		key: "onPostStateUpdate",
		value: function onPostStateUpdate(action, impl) {
			var listeners = this._listeners;

			for (var i = 0, l; l = listeners[i]; i++) {
				if (l.onPostStateUpdate) {
					l.onPostStateUpdate(this, action, impl);
				}
			}
		}
	}, {
		key: "onPreUpdate",
		value: function onPreUpdate(currState, time) {
			var listeners = this._listeners;

			for (var i = 0, l; l = listeners[i]; i++) {
				if (l.onPreUpdate) {
					l.onPreUpdate(this, currState, time);
				}
			}
		}
	}, {
		key: "onPostUpdate",
		value: function onPostUpdate(time, currState, prevState) {
			var listeners = this._listeners;

			for (var i = 0, l; l = listeners[i]; i++) {
				if (l.onPostUpdate) {
					l.onPostUpdate(this, time, currState, prevState);
				}
			}
		}
	}, {
		key: "addListener",
		value: function addListener(callback) {
			this._listeners.push(callback);
		}
	}, {
		key: "removeListener",
		value: function removeListener(callback) {
			var idx;

			while ((idx = this._listeners.indexOf(callback)) != -1) {
				this._listeners.splice(idx, 1);
			}
		}

		//******************************************************************************************************************
		//  Dispatcher related methods
		//******************************************************************************************************************

	}, {
		key: "dispatchUpdate",
		value: function dispatchUpdate(action) {
			if (this._updateAction) {
				throw new Error("Pending action already waiting for dispatch");
			}

			this._updateAction = action;

			this.schedule();
		}

		/*
  	Schedules pending tasks to execute. This method should not need to be called by code external to the class.
  */

	}, {
		key: "schedule",
		value: function schedule() {
			var _this2 = this;

			// Nothing to do if no registered pendingActions
			if (!this._updateAction && !this._waitFor.length) {
				return;
			}

			_setTimeout(function () {
				return _this2._exec();
			});
		}

		/*
  	Executes all pending updates and waitFor() requests synchronously.
  */

	}, {
		key: "updateNow",
		value: function updateNow(syncExec) {
			this._exec();

			if (syncExec && syncExec()) {
				this._exec();
			}
		}
	}, {
		key: "waitFor",
		value: function waitFor(callback) {
			this._waitFor.push(callback);

			this.schedule();
		}

		//******************************************************************************************************************
		//  Promise and timer setup methods
		//******************************************************************************************************************

	}, {
		key: "_exec",
		value: function _exec() {
			var updateAction = this._updateAction;
			var waitFor = this._waitFor;

			// Reset the pending actions
			this._updateAction = null;
			this._waitFor = [];

			if (updateAction) {
				if (this._updating) {
					debugger;
					throw new Error("Already updating state - use store.waitFor()");
				}

				try {
					this._updating = true;

					var currState = this._state;
					var time = this._updateTime = (0, _tick2.default)();

					// inform middleware going to perform an update
					this.onPreUpdate(currState, time);

					this._rootImpl.willShadow(false);

					// perform the update action
					var impl = updateAction(time);

					if (!(impl instanceof _ShadowImpl2.default)) {
						this._onError("Property update action did not return a ShadowImpl type");
					} else if (impl.property != this._root) {
						this._onError("Property update action cannot replace the root state");
					} else {
						this._rootImpl = impl;
						this._state = impl.state;

						// Have each property invoke did shadow/update lifecycle methods now that store is coherent with new stat
						this._rootImpl.didShadow(time, false);
					}

					// inform middleware update completed
					this.onPostUpdate(time, this._state, currState);
				} catch (error) {
					this._onError("State dispatch UPDATE action exception: " + error, error);
				} finally {
					this._updating = false;
				}
			}

			this._notifyWaitFors(waitFor);
			this._notifySubscribers();
		}
	}, {
		key: "_notifySubscribers",
		value: function _notifySubscribers() {
			// Iterate each subscriber
			for (var i = 0, subscriber; subscriber = this._subscribers[i]; i++) {
				try {
					subscriber(this);
				} catch (error) {
					this._onError("Store subscriber notification caused an exception: " + error, error);
				}
			}
		}
	}, {
		key: "_notifyWaitFors",
		value: function _notifyWaitFors(waitFor) {
			// Iterate each waitFor request
			for (var i = 0, waiting; waiting = waitFor[i]; i++) {
				try {
					waiting();
				} catch (error) {
					this._onError("Store dispatch waitFor() request exception: " + error, error);
				}
			}
		}
	}, {
		key: "_onError",
		value: function _onError(msg, error) {
			console.warn("State error: " + error);
			error && error.stack && console.warn(error.stack);

			debugger;
			this.onError(msg, error);
		}
	}, {
		key: "updateTime",
		get: function get() {
			return this._updateTime;
		}
	}, {
		key: "root",
		get: function get() {
			return this._root;
		}
	}, {
		key: "shadow",
		get: function get() {
			return this._root._;
		}
	}, {
		key: "state",
		get: function get() {
			return this._state;
		}
	}], [{
		key: "getPromise",
		value: function getPromise() {
			return _Promise;
		}
	}, {
		key: "setPromise",
		value: function setPromise(promise) {
			_Promise = promise;
		}
	}, {
		key: "setTick",
		value: function setTick(ticker) {
			_clearInterval = ticker.clearInterval;
			_clearTimeout = ticker.clearTimeou;
			_setInterval = ticker.setInterval;
			_setTimeout = ticker.setTimeout;
		}

		//******************************************************************************************************************
		//  Promise and timer convenience methods
		//******************************************************************************************************************

	}, {
		key: "clearInterval",
		value: function clearInterval(intervalId) {
			return _clearInterval(intervalId);
		}
	}, {
		key: "clearTimeout",
		value: function clearTimeout(timerId) {
			return _clearTimeout(timerId);
		}
	}, {
		key: "setInterval",
		value: function setInterval(callback, time) {
			for (var _len = arguments.length, params = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
				params[_key - 2] = arguments[_key];
			}

			return _setInterval.apply(undefined, [callback, time].concat(params));
		}
	}, {
		key: "setTimeout",
		value: function setTimeout(callback, time) {
			for (var _len2 = arguments.length, params = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
				params[_key2 - 2] = arguments[_key2];
			}

			return _setTimeout.apply(undefined, [callback, time].concat(params));
		}
	}, {
		key: "all",
		value: function all(promises) {
			return _Promise.all(promises);
		}
	}, {
		key: "promise",
		value: function promise(callback) {
			return new _Promise(callback);
		}
	}, {
		key: "reject",
		value: function reject(error) {
			return _Promise.reject(error);
		}
	}, {
		key: "resolve",
		value: function resolve() {
			var _Promise$resolve;

			for (var _len3 = arguments.length, params = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
				params[_key3] = arguments[_key3];
			}

			return (_Promise$resolve = _Promise.resolve).call.apply(_Promise$resolve, [_Promise].concat(params));
		}
	}]);

	return Store;
}();

exports.default = Store;