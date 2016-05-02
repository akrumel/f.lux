"use strict";

exports.__esModule = true;
exports.default = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _ArrayProperty = require("../ArrayProperty");

var _ArrayProperty2 = _interopRequireDefault(_ArrayProperty);

var _KeyedProperty2 = require("../KeyedProperty");

var _KeyedProperty3 = _interopRequireDefault(_KeyedProperty2);

var _MapProperty = require("../MapProperty");

var _MapProperty2 = _interopRequireDefault(_MapProperty);

var _PrimitiveProperty = require("../PrimitiveProperty");

var _PrimitiveProperty2 = _interopRequireDefault(_PrimitiveProperty);

var _Store = require("../Store");

var _Store2 = _interopRequireDefault(_Store);

var _assert = require("../utils/assert");

var _assert2 = _interopRequireDefault(_assert);

var _isObject = require("../utils/isObject");

var _isObject2 = _interopRequireDefault(_isObject);

var _uuid = require("../utils/uuid");

var _uuid2 = _interopRequireDefault(_uuid);

var _doneIterator = require("../utils/doneIterator");

var _doneIterator2 = _interopRequireDefault(_doneIterator);

var _iteratorFor = require("../utils/iteratorFor");

var _iteratorFor2 = _interopRequireDefault(_iteratorFor);

var _iterateOver = require("../utils/iterateOver");

var _iterateOver2 = _interopRequireDefault(_iterateOver);

var _CollectionShadow = require("./CollectionShadow");

var _CollectionShadow2 = _interopRequireDefault(_CollectionShadow);

var _ModelProperty = require("./ModelProperty");

var _ModelProperty2 = _interopRequireDefault(_ModelProperty);

var _CollectionOptions = require("./CollectionOptions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _endpoint = "_endpoint";
var _fetching = 'fetching';
var _id2cid = "_id2cid";
var _idName = "idName";
var _lastPageSize = 'lastPageSize';
var _limit = '_limit';
var _models = "_models";
var _nextOffset = 'nextOffset';
var _paging = '_paging';
var _synced = "synced";

var _isFetching = Symbol('isFetching');

/*
	Rework API:
		- same ctor as all other properties
		- separate method to setup element shader:
			- setElementShader(shader/factoryShader)
			- setElementType(type, initState, autoshadow, readonly)
		- method to get child shader (shader.modelsShader.childShader)


	CollectionProperty.dataSpec = {
		[_idName]: StateTypes.Primitive.initialState("id"),
		[_fetching]: StateTypes.Primitive.initialState(false).readonly,
		[_id2cid]: StateTypes.Map,
		[_synced]: StateTypes.Primitive.initialState(false).autoshadowOff.readonly,
		[_models]: StateTypes.mapOf(StateTypes.property(ModelProperty))
	}
*/

var CollectionProperty = function (_KeyedProperty) {
	_inherits(CollectionProperty, _KeyedProperty);

	function CollectionProperty() {
		var MemberPropertyClass = arguments.length <= 0 || arguments[0] === undefined ? _MapProperty2.default : arguments[0];
		var autoShadow = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
		var readonly = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

		_classCallCheck(this, CollectionProperty);

		// keep isFetching as an instance variable because transient data and so can give immediate
		// feedback to prevent concurrent fetches

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CollectionProperty).call(this, {}, false));

		_this[_isFetching] = false;

		_this.addProperty(_idName, new _PrimitiveProperty2.default("id", true));
		_this.addProperty(_fetching, new _PrimitiveProperty2.default(false, false, true));
		_this.addProperty(_id2cid, new _MapProperty2.default({}, true));
		_this.addProperty(_synced, new _PrimitiveProperty2.default(false, false, true));

		// pagingTime instance variable used for ensuring overlapping paging requests do not mess up offset
		// this can happen when a paging request is in progress when limit is changed
		_this.pagingTime = null;
		_this.addProperty(_lastPageSize, new _PrimitiveProperty2.default(null, false, true));
		_this.addProperty(_limit, new _PrimitiveProperty2.default(50, false, true));
		_this.addProperty(_nextOffset, new _PrimitiveProperty2.default(0, false, true));
		_this.addProperty(_paging, new _PrimitiveProperty2.default(false, false, true));

		// '_models' property contains ModelProperty objects which in turn keep their model state in
		// the 'data' whose type is specified by the 'MemberPropertyClass' parameter.
		var models = new _MapProperty2.default();
		var modelsShader = models.shader();

		_this.addProperty(_models, models);
		modelsShader.setElementClass(_ModelProperty2.default, {}, true, false);
		modelsShader.childShader.addPropertyClass("data", MemberPropertyClass, {}, autoShadow, readonly);
		return _this;
	}

	//------------------------------------------------------------------------------------------------------
	// Paging API (could improve by adding two offsets and maintain max pages)
	//------------------------------------------------------------------------------------------------------

	_createClass(CollectionProperty, [{
		key: "fetchNext",
		value: function fetchNext() {
			var _this2 = this;

			var mergeOp = arguments.length <= 0 || arguments[0] === undefined ? _CollectionOptions.MERGE_OPTION : arguments[0];

			if (this.pagingTime) {
				throw new Error("Paging operation in progress");
			} else if (!this.hasMorePages()) {
				return _Store2.default.resolve(this._);
			}

			var filter = this.endpoint.queryBuilder();
			var time = this.pagingTime = Date.now();

			this.set(_paging, true);

			filter.equals("offset", this._[_nextOffset]);
			filter.equals("limit", this._[_limit]);

			return this.fetch(filter, mergeOp, false, function (error, models) {
				// bail if paging times do not match (offset likely reset)
				if (time !== _this2.pagingTime) {
					return;
				}

				_this2.pagingTime = null;
				_this2.set(_paging, false);

				if (error) {
					return;
				}

				_this2.set(_nextOffset, _this2._[_nextOffset] + models.length);
				_this2.set(_lastPageSize, models.length);

				if (models.length < _this2._[_limit]) {
					_this2.set(_synced, true);
				}
			});
		}
	}, {
		key: "isPaging",
		value: function isPaging() {
			var state = arguments.length <= 0 || arguments[0] === undefined ? this._ : arguments[0];

			// use pagingTime instance variable (instant) and _paging state variable (tied to state) to
			// return the most conservative value
			return this.pagingTime || state[_paging];
		}
	}, {
		key: "hasMorePages",
		value: function hasMorePages() {
			var state = arguments.length <= 0 || arguments[0] === undefined ? this._ : arguments[0];

			return this.isConnected() && !state[_synced] && (!state[_lastPageSize] || this._[_lastPageSize] >= this._[_limit]);
		}
	}, {
		key: "resetPaging",
		value: function resetPaging() {
			this.set(_lastPageSize, null);
			this.set(_nextOffset, 0);
			this.set(_paging, false);
		}
	}, {
		key: "setLimit",
		value: function setLimit(limit) {
			this.pagingTime = null;

			this.set(_limit, limit);
			this.set(_lastPageSize, null);
			this.set(_nextOffset, 0);
			this.set(_paging, false);
		}

		//------------------------------------------------------------------------------------------------------
		// Experimental data spec stuff
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "setElementClass",
		value: function setElementClass() {
			var MemberPropertyClass = arguments.length <= 0 || arguments[0] === undefined ? _MapProperty2.default : arguments[0];
			var initialState = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
			var autoShadow = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
			var readonly = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

			var models = this._[_models];
			var modelsShader = models.shader();

			modelsShader.childShader.setElementClass(MemberPropertyClass, initialState, autoShadow, readonly);
		}

		//------------------------------------------------------------------------------------------------------
		// Endpoint methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "clearEndpoint",
		value: function clearEndpoint() {
			this.removeAllModels();
			this.removeProperty(_endpoint);
		}
	}, {
		key: "setEndpoint",
		value: function setEndpoint(endPoint) {
			this.resetPaging();
			this.removeAllModels();
			this.addProperty(_endpoint, endPoint);
		}

		//------------------------------------------------------------------------------------------------------
		// Property subclasses may want to override thise methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "shadowClass",
		value: function shadowClass() {
			return _CollectionShadow2.default;
		}

		//------------------------------------------------------------------------------------------------------
		// Collection methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "addModel",


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
		value: function addModel(state) {
			var mergeOp = arguments.length <= 1 || arguments[1] === undefined ? _CollectionOptions.DEFAULTS_OPTION : arguments[1];

			if (!this.isConnected()) {
				throw new Error("Collection is not connected.");
			}

			var id = this.extractId(state);

			// just add the model
			if (!id || !this.hasModel(id) || mergeOp === _CollectionOptions.REPLACE_OPTION) {
				var modelDefn = _ModelProperty2.default.modelDefinitionFor(state, this);
				var models = this._[_models];

				models.set(modelDefn.cid, modelDefn);

				return modelDefn.id;
			} else {
				var currModel = this._getModel(id);

				switch (mergeOp) {
					case _CollectionOptions.NONE_OPTION:
						break;
					case _CollectionOptions.MERGE_OPTION:
						currModel.merge(state);
						break;
					case _CollectionOptions.REPLACE_OPTION:
						currModel.setData(state);
						break;
					case _CollectionOptions.DEFAULTS_OPTION:
						currModel.defaults(state);
						break;
					default:
						throw new Error("Invalid post-save option: " + mergeOp);
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

	}, {
		key: "addModels",
		value: function addModels(states) {
			var mergeOp = arguments.length <= 1 || arguments[1] === undefined ? _CollectionOptions.DEFAULTS_OPTION : arguments[1];
			var syncOp = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

			if (!this.isConnected()) {
				throw new ("Collection " + this.slashPath + " is not connected")();
			}

			var id, state;

			if (syncOp) {
				this.set(_synced, true);
			}

			for (var i = 0, len = states.length; i < len; i++) {
				this.addModel(states[i], mergeOp);
			}
		}

		/*
  	Combines an add and save actions.
  */

	}, {
		key: "create",
		value: function create(state) {
			var _this3 = this;

			if (!this.isConnected()) {
				return _Store2.default.reject("Collection " + this.slashPath + " is not connected");
			}

			var cid = this.addModel(states);

			return _Store2.default.promise(function (resolve, reject) {
				// wait for the new model to be placed into state
				_this3.store.waitFor(function () {
					try {
						_this3.save(cid).then(resolve).catch(reject);
					} catch (error) {
						_this3.onError(error, "Fetch all models", reject);
					}
				});
			});
		}
	}, {
		key: "destroy",
		value: function destroy(id) {
			var _this4 = this;

			if (!this.hasModel(id)) {
				return _Store2.default.resolve(this._);
			}

			return _Store2.default.promise(function (resolve, reject) {
				try {
					var _ret = function () {
						var model = _this4._getModel(id);

						if (!model || model.isNew()) {
							return {
								v: resolve(_this4._)
							};
						}

						_this4.endpoint.doDelete(id).then(function () {
							_this4._[_models].delete(model.cid);
							_this4._[_id2cid].delete(model.id);

							resolve(_this4._);
						}).catch(function (error) {
							return _this4.onError(error, "Fetch all models", reject);
						});
					}();

					if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
				} catch (error) {
					_this4.onError(error, "Fetch all models", reject);
				}
			});
		}

		// No reset option - always resets

	}, {
		key: "fetch",
		value: function fetch() {
			var filter = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
			var mergeOp = arguments.length <= 1 || arguments[1] === undefined ? _CollectionOptions.REPLACE_OPTION : arguments[1];

			var _this5 = this;

			var replaceAll = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
			var callback = arguments[3];

			if (!this.isConnected()) {
				return _Store2.default.reject("Collection " + this.slashPath + " is not connected");
			}

			var syncOp = !filter;

			this.setIsFetching(true);

			try {
				return this.endpoint.doFetch(filter).then(function (models) {
					try {
						_this5.setIsFetching(false);

						// invoke the callback before processing models
						callback && callback(null, models);

						if (replaceAll) {
							_this5.setModels(models, syncOp);
						} else {
							_this5.addModels(models, mergeOp, syncOp);
						}

						_this5.store.updateNow();

						return models;
					} catch (error) {
						return _this5.onError(error, "Fetch error while setting models");
					}
				}).catch(function (error) {
					_this5.setIsFetching(false);

					// invoke the callback with the error
					callback && callback(error, null);

					return _this5.onError(error, "Fetch all models");
				});
			} catch (error) {
				this.setIsFetching(false);

				// invoke the callback with the error
				callback && callback(error, null);

				throw error;
			}
		}
	}, {
		key: "find",
		value: function find(id) {
			var _this6 = this;

			if (!this.isConnected()) {
				return _Store2.default.reject("Collection " + this.slashPath + " is not connected");
			}

			return _Store2.default.promise(function (resolve, reject) {
				try {
					var model = _this6._getModel(id);

					if (model) {
						//log( l => l.requestSuccess(this, `Find model ${ mid(id) }`) );

						resolve(model.data);
					} else {
						_this6.endpoint.doFind(id).then(function (state) {
							_this6.addModel(state, _CollectionOptions.NONE_OPTION);

							_this6.store.waitFor(function () {
								resolve(_this6.getModel(id));
							});
						}).catch(function (error) {
							return _this6.onError(error, "Find model " + id, reject);
						});
					}
				} catch (error) {
					_this6.onError(error, "Find model " + id, reject);
				}
			});
		}
	}, {
		key: "getModel",
		value: function getModel(id) {
			var state = arguments.length <= 1 || arguments[1] === undefined ? this._ : arguments[1];

			var model = this._getModel(id, state);

			return model && model.data;
		}
	}, {
		key: "hasModel",
		value: function hasModel(id) {
			var state = arguments.length <= 1 || arguments[1] === undefined ? this._ : arguments[1];

			return state[_id2cid].has(id) || state[_models].has(id);
		}

		/*
  	Gets if the collection is active (has a shadow) and an endpoint.
  */

	}, {
		key: "isConnected",
		value: function isConnected() {
			return this._[_endpoint] && this._[_endpoint].isConnected();
		}
	}, {
		key: "isNew",
		value: function isNew(id) {
			var state = arguments.length <= 1 || arguments[1] === undefined ? this._ : arguments[1];

			var model = this._getModel(id, state);

			return model && model.isNew();
		}

		/*
  	Gets the shadow models currently managed by the collection.
  		Returns an array of models already fetched and/or added.
  */

	}, {
		key: "modelsArray",
		value: function modelsArray(state) {
			if (!state && !this.isConnected()) {
				throw new Error("Collection is not connected.");
			}

			state = state || this._;

			var models = state[_models];
			var keys = Object.keys(models);
			var result = [];

			for (var i = 0, len = keys.length; i < len; i++) {
				result.push(models[keys[i]].data);
			}

			return result;
		}
	}, {
		key: "modelEntries",
		value: function modelEntries(state) {
			var _this7 = this;

			if (!state && !this.isActive()) {
				return _doneIterator2.default;
			}

			state = state || this._;

			var models = state[_models];
			var keys = this.modelKeysArray(state);

			return (0, _iterateOver2.default)(keys, function (key) {
				return [key, _this7.getModel(key)];
			});
		}
	}, {
		key: "modelKeys",
		value: function modelKeys() {
			var state = arguments.length <= 0 || arguments[0] === undefined ? this._ : arguments[0];

			// too brute force but quick and sure to work
			return (0, _iteratorFor2.default)(this.modelKeysArray(state));
		}
	}, {
		key: "modelKeysArray",
		value: function modelKeysArray(state) {
			if (!state && !this.isActive()) {
				return _doneIterator2.default;
			}

			state = state || this._;

			return Object.keys(state[_models]);
		}
	}, {
		key: "modelValues",
		value: function modelValues() {
			var _this8 = this;

			var state = arguments.length <= 0 || arguments[0] === undefined ? this._ : arguments[0];

			return (0, _iterateOver2.default)(this.modelKeysArray(state), function (key) {
				return _this8.getModel(key, state);
			});
		}

		/*
  	Removes all models from the collection and marks the collection as having not synched with the
  	endpoint.
  */

	}, {
		key: "removeAllModels",
		value: function removeAllModels() {
			if (!this.isActive()) {
				return;
			}

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

	}, {
		key: "save",
		value: function save(id) {
			var _this9 = this;

			var mergeOp = arguments.length <= 1 || arguments[1] === undefined ? _CollectionOptions.DEFAULTS_OPTION : arguments[1];

			if (!this.isConnected()) {
				return _Store2.default.reject("Collection " + this.slashPath + " is not connected");
			}

			return _Store2.default.promise(function (resolve, reject) {
				try {
					(function () {
						var model = _this9._getModel(id);
						var cid = model.cid;
						var shadow = model.data;
						var shadowState = shadow.__.state;

						var op = _this9.isNew(shadow) ? _this9.endpoint.doCreate.bind(_this9.endpoint, shadow, shadowState) : _this9.endpoint.doUpdate.bind(_this9.endpoint, id, shadow, shadowState);

						op().then(function (savedState) {
							var currModel = model.$.latest();
							var savedId = _this9.extractId(savedState);

							// Put an entry in id->cid mapping
							if (savedId != id) {
								_this9._[_id2cid].set(id, cid);
							}

							switch (mergeOp) {
								case _CollectionOptions.NONE_OPTION:
									if (savedId !== id) {
										currModel.changeId(savedId);
									}

									break;
								case _CollectionOptions.MERGE_OPTION:
									currModel.merge(savedState);
									break;
								case _CollectionOptions.REPLACE_OPTION:
									currModel.setData(savedState);
									break;
								case _CollectionOptions.DEFAULTS_OPTION:
									currModel.defaults(saveState);
									break;
								default:
									return reject("Invalid post-save option: " + mergeOp);
							}
						}).catch(function (error) {
							return _this9.onError(error, "Save " + id + " - cid=" + shadow.$.cid, reject);
						});
					})();
				} catch (error) {
					_this9.onError(error, "Save model", reject);
				}
			});
		}
	}, {
		key: "setIdName",
		value: function setIdName(idName) {
			this._[_idName] = idName;
		}
	}, {
		key: "setIsFetching",
		value: function setIsFetching(fetching) {
			this[_isFetching] = fetching;
			this.set(_fetching, fetching);
		}

		/*
  	Bulk replaces current models with an array of new models.
  		See comments for addModels().
  */

	}, {
		key: "setModels",
		value: function setModels(models) {
			var syncOp = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

			this.removeAllModels();
			this.addModels(models, _CollectionOptions.REPLACE_OPTION, syncOp);
		}

		//------------------------------------------------------------------------------------------------------
		// Methods Collection subclasses may want to override
		//------------------------------------------------------------------------------------------------------

		/*
  	Generates an ID for a new object. The default implementation generates: temp-[UUID].
  */

	}, {
		key: "makeId",
		value: function makeId() {
			return "temp-" + (0, _uuid2.default)();
		}

		/*
  	Subclasses can override this method to remove underlying transport specific properties.
  */

	}, {
		key: "clean",
		value: function clean(json) {
			return json;
		}

		/*
  	Used by the private _shadow() method to get the id from the model JSON representation as returned by the
  	subclass doXXX() apis. The default implementation simply returns the 'id' model property.
  */

	}, {
		key: "extractId",
		value: function extractId(model) {
			var idName = this._[_idName];

			return (0, _isObject2.default)(model) ? model[idName] : model;
		}
	}, {
		key: "onError",
		value: function onError(error, opMsg, reject) {
			var msg;

			if (error.status) {
				msg = "Error during collection operation '" + opMsg + "' - Server Error: status=" + (error.status + " (" + error.response.statusText + ")");
			} else if (error.message) {
				msg = "Error during collection operation '" + opMsg + "' - Collection Error: " + error.message;
			} else {
				msg = "Error during collection operation '" + opMsg + "' - Error: " + error;
			}

			console.warn(msg);
			if (error.stack) {
				console.warn(error.stack);
			}

			if (reject) {
				reject(new Error(msg));
			} else {
				return _Store2.default.reject(msg);
			}
		}

		//------------------------------------------------------------------------------------------------------
		// Private methods
		//------------------------------------------------------------------------------------------------------

		/*
  	Gets the Model container object NOT the actual model.
  */

	}, {
		key: "_getModel",
		value: function _getModel(id) {
			var state = arguments.length <= 1 || arguments[1] === undefined ? this._ : arguments[1];

			var id2cid = state[_id2cid];
			var cid = id2cid.has(id) ? id2cid.get(id) : id;

			return state[_models].get(cid);
		}
	}, {
		key: "endpoint",
		get: function get() {
			return this.isActive() && this._[_endpoint];
		}
	}, {
		key: "modelsCount",
		get: function get() {
			return state[_models].size;
		}
	}]);

	return CollectionProperty;
}(_KeyedProperty3.default);

exports.default = CollectionProperty;