"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash.has");

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require("lodash.sortby");

var _lodash4 = _interopRequireDefault(_lodash3);

var _Shadow2 = require("../Shadow");

var _Shadow3 = _interopRequireDefault(_Shadow2);

var _iteratorFor = require("../utils/iteratorFor");

var _iteratorFor2 = _interopRequireDefault(_iteratorFor);

var _CollectionOptions = require("./CollectionOptions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _valuesArray = Symbol('_valuesArray');
var _keysArray = Symbol('_keysArray');

var CollectionShadow = function (_Shadow) {
	_inherits(CollectionShadow, _Shadow);

	function CollectionShadow(impl) {
		_classCallCheck(this, CollectionShadow);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(CollectionShadow).call(this, impl));
	}

	_createClass(CollectionShadow, [{
		key: "fetchNext",
		value: function fetchNext() {
			var mergeOp = arguments.length <= 0 || arguments[0] === undefined ? _CollectionOptions.REPLACE_OPTION : arguments[0];

			return this.$$.fetchNext(mergeOp);
		}
	}, {
		key: "hasMorePages",
		value: function hasMorePages() {
			return this.$$.hasMorePages(this);
		}
	}, {
		key: "setLimit",
		value: function setLimit(limit) {
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

	}, {
		key: "addModel",
		value: function addModel(state) {
			var mergeOp = arguments.length <= 1 || arguments[1] === undefined ? _CollectionOptions.DEFAULTS_OPTION : arguments[1];

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

	}, {
		key: "addModels",
		value: function addModels(states) {
			var mergeOp = arguments.length <= 1 || arguments[1] === undefined ? _CollectionOptions.DEFAULTS_OPTION : arguments[1];

			this.$$.addModels(states, mergeOp);
		}
	}, {
		key: "clear",
		value: function clear() {
			this.$$.removeAllModels();
		}

		/*
  	Compbines an add and save actions.
  */

	}, {
		key: "create",
		value: function create(model) {
			return this.$$.create(model);
		}
	}, {
		key: "destroy",
		value: function destroy(id) {
			return this.$$.destory(id);
		}
	}, {
		key: "entries",
		value: function entries() {
			return this.$$.modelEntries(this);
		}
	}, {
		key: "every",
		value: function every(iteratee, context) {
			var keys = this.keysArray();
			var key, value;

			for (var i = 0, len = keys.length; i < len; i++) {
				key = keys[i];
				value = this.get(key);

				if (!iteratee.call(context, value, key, this)) {
					return false;
				}
			}

			return true;
		}
	}, {
		key: "fetch",
		value: function fetch() {
			var filter = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
			var mergeOp = arguments.length <= 1 || arguments[1] === undefined ? _CollectionOptions.REPLACE_OPTION : arguments[1];

			return this.$$.fetch(filter, mergeOp);
		}
	}, {
		key: "filter",
		value: function filter(iteratee, context) {
			var keys = this.keysArray();
			var acc = [];
			var key, value;

			for (var i = 0, len = keys.length; i < len; i++) {
				key = keys[i];
				value = this.get(key);

				if (iteratee.call(context, value, key, this)) {
					acc.push(value);
				}
			}

			return acc;
		}
	}, {
		key: "find",
		value: function find(id) {
			return this.$$.find(id);
		}
	}, {
		key: "findModel",
		value: function findModel(iteratee, context) {
			var keys = this.keysArray();
			var key, value;

			for (var i = 0, len = keys.length; i < len; i++) {
				key = keys[i];
				value = this.get(key);

				if (iteratee.call(context, value, key, this)) {
					return value;
				}
			}

			return undefined;
		}
	}, {
		key: "forEach",
		value: function forEach(callback, context) {
			var keys = this.keysArray();
			var key;

			for (var i = 0, len = keys.length; i < len; i++) {
				key = keys[i];

				callback.call(context, this.get(key), key, this);
			}
		}
	}, {
		key: "get",
		value: function get(id) {
			return this.$$.getModel(id, this);
		}
	}, {
		key: "groupBy",
		value: function groupBy(callback, context) {
			var keys = this.keysArray();
			var result = {};
			var key, value, groupId;

			for (var i = 0, len = keys.length; i < len; i++) {
				key = keys[i];
				value = this.get(key);
				groupId = callback.call(context, value, key, this);

				if ((0, _lodash2.default)(result, groupId)) {
					result[groupId].push(value);
				} else {
					result[groupId] = [value];
				}
			}
		}
	}, {
		key: "has",
		value: function has(id) {
			return this.$$.hasModel(id, this);
		}
	}, {
		key: "isConnected",
		value: function isConnected() {
			return this.$$.isConnected();
		}
	}, {
		key: "isNew",
		value: function isNew(id) {
			return this.$$.isNew(id, this);
		}
	}, {
		key: "keys",
		value: function keys() {
			return this.$$.modelKeys(this);
		}
	}, {
		key: "keysArray",
		value: function keysArray() {
			if (!this[_keysArray]) {
				this[_keysArray] = this.$$.modelKeysArray(this);
			}

			return this[_keysArray];
		}
	}, {
		key: "map",
		value: function map(iteratee, context) {
			var keys = this.keysArray();
			var acc = [];
			var key;

			for (var i = 0, len = keys.length; i < len; i++) {
				key = keys[i];

				acc.push(iteratee.call(context, this.get(key), key, this));
			}

			return acc;
		}
	}, {
		key: "reduce",
		value: function reduce(iteratee, acc, context) {
			var keys = this.keysArray();
			var key, value;

			for (var i = 0, len = keys.length; i < len; i++) {
				key = keys[i];
				value = this.get(key);

				acc = iteratee.call(context, acc, value, key, this);
			}

			return acc;
		}
	}, {
		key: "setEndpoint",
		value: function setEndpoint(endPoint) {
			this.$$.setEndpoint(endPoint);
		}
	}, {
		key: "setModels",
		value: function setModels(models) {
			this.$$.setModels(models);
		}
	}, {
		key: "some",
		value: function some(iteratee, context) {
			var keys = this.keysArray();
			var key, value;

			for (var i = 0, len = keys.length; i < len; i++) {
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

	}, {
		key: "sortBy",
		value: function sortBy() {
			var values = this.valuesArray();

			for (var _len = arguments.length, iteratee = Array(_len), _key = 0; _key < _len; _key++) {
				iteratee[_key] = arguments[_key];
			}

			return _lodash4.default.apply(null, [values].concat(iteratee));
		}
	}, {
		key: "values",
		value: function values() {
			return this.$$.modelValues(this);
		}
	}, {
		key: "valuesArray",
		value: function valuesArray() {
			if (!this[_valuesArray]) {
				this[_valuesArray] = this.$$.modelsArray(this);
			}

			return this[_valuesArray];
		}
	}, {
		key: Symbol.iterator,
		value: function value() {
			return this.$$.modelEntries(this);
		}
	}, {
		key: "endpoint",
		get: function get() {
			return this._endpoint;
		}
	}, {
		key: "size",
		get: function get() {
			return this._models.size;
		}

		//------------------------------------------------------------------------------------------------------
		// Paging API
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "limit",
		get: function get() {
			return this._limit;
		}
	}, {
		key: "paging",
		get: function get() {
			return this.$$.isPaging(this);
		}
	}]);

	return CollectionShadow;
}(_Shadow3.default);

exports.default = CollectionShadow;