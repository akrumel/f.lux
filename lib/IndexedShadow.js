"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash.has");

var _lodash2 = _interopRequireDefault(_lodash);

var _Shadow2 = require("./Shadow");

var _Shadow3 = _interopRequireDefault(_Shadow2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ArrayShadow = function (_Shadow) {
	_inherits(ArrayShadow, _Shadow);

	function ArrayShadow() {
		_classCallCheck(this, ArrayShadow);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(ArrayShadow).apply(this, arguments));
	}

	_createClass(ArrayShadow, [{
		key: "every",


		//------------------------------------------------------------------------------------------------------
		//	Read-only array methods
		//------------------------------------------------------------------------------------------------------

		value: function every(pred, context) {
			for (var i = 0, len = this.length; i < len; i++) {
				if (!pred.call(context, this[i], i, this)) {
					return false;
				}
			}

			return true;
		}
	}, {
		key: "filter",
		value: function filter(callback, context) {
			var acc = [];

			for (var i = 0, len = this.length; i < len; i++) {
				if (callback.call(context, this[i], i, this)) {
					acc.push(v);
				}
			}

			return acc;
		}
	}, {
		key: "find",
		value: function find(pred, context) {
			for (var i = 0, len = this.length; i < len; i++) {
				if (pred.call(context, this[i], i, this)) {
					return this[i];
				}
			}
		}
	}, {
		key: "findIndex",
		value: function findIndex(pred, context) {
			for (var i = 0, len = this.length; i < len; i++) {
				if (pred.call(context, this[i], i, this)) {
					return i;
				}
			}
		}
	}, {
		key: "forEach",
		value: function forEach(callback, context) {
			for (var i = 0, len = this.length; i < len; i++) {
				callback.call(context, this[i], i, this);
			}
		}
	}, {
		key: "groupBy",
		value: function groupBy(callback, context) {
			var result = {};

			for (var i = 0, len = this.length; i < len; i++) {
				var prop = this[i];
				var key = callback.call(context, prop);

				if ((0, _lodash2.default)(result, key)) {
					result[key].push(prop);
				} else {
					result[key] = [prop];
				}
			}

			return result;
		}
	}, {
		key: "includes",
		value: function includes(searchElement) {
			var fromIndex = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

			return this.indexOf(searchElement, fromIndex) != -1;
		}
	}, {
		key: "indexOf",
		value: function indexOf(value) {
			var fromIndex = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

			var fromIdx = Math.min(fromIndex, this.length);

			for (var i = fromIdx, len = this.length; i < len; i++) {
				if (this[i] === value) {
					return i;
				}
			}

			return -1;
		}
	}, {
		key: "join",
		value: function join() {
			var separator = arguments.length <= 0 || arguments[0] === undefined ? ',' : arguments[0];

			return this.__.state.join(separator);
		}
	}, {
		key: "lastIndexOf",
		value: function lastIndexOf(value) {
			var fromIndex = arguments.length <= 1 || arguments[1] === undefined ? this.length - 1 : arguments[1];

			if (!this.length) {
				return -1;
			}

			for (var i = Math.min(fromIndex, this.length - 1); i >= 0; i--) {
				if (this[i] === value) {
					return i;
				}
			}

			return -1;
		}
	}, {
		key: "map",
		value: function map(callback, context) {
			var acc = [];

			for (var i = 0, len = this.length; i < len; i++) {
				acc.push(callback.call(context, this[i], i, this));
			}

			return acc;
		}
	}, {
		key: "reduce",
		value: function reduce(callback, acc, context) {
			for (var i = 0, len = this.length; i < len; i++) {
				acc = callback.call(context, acc, this[i], i, this);
			}

			return acc;
		}
	}, {
		key: "some",
		value: function some(pred, context) {
			for (var i = 0, len = this.length; i < len; i++) {
				if (pred.call(context, this[i], i, this)) {
					return true;
				}
			}

			return false;
		}

		/*
  	The values() method returns a new Array Iterator object that contains the values for each index in the array.
  */

	}, {
		key: "values",
		value: function values() {
			var _this2 = this;

			var i = 0;
			var length = this.length;
			var next = function next() {
				return i < length ? { value: _this2[i++], done: false } : { done: true };
			};

			return _defineProperty({
				next: next
			}, Symbol.iterator, function () {
				return { next: next };
			});
		}
	}, {
		key: Symbol.iterator,
		value: function value() {
			return this.values();
		}
	}, {
		key: "length",
		get: function get() {
			return this.__.length;
		}
	}]);

	return ArrayShadow;
}(_Shadow3.default);

exports.default = ArrayShadow;