"use strict";

exports.__esModule = true;
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash.topairs");

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require("lodash.has");

var _lodash4 = _interopRequireDefault(_lodash3);

var _KeyedShadowImpl = require("./KeyedShadowImpl");

var _KeyedShadowImpl2 = _interopRequireDefault(_KeyedShadowImpl);

var _Property2 = require("./Property");

var _Property3 = _interopRequireDefault(_Property2);

var _PropertyFactoryShader = require("./PropertyFactoryShader");

var _PropertyFactoryShader2 = _interopRequireDefault(_PropertyFactoryShader);

var _assert = require("./utils/assert");

var _assert2 = _interopRequireDefault(_assert);

var _doneIterator = require("./utils/doneIterator");

var _doneIterator2 = _interopRequireDefault(_doneIterator);

var _iteratorFor = require("./utils/iteratorFor");

var _iteratorFor2 = _interopRequireDefault(_iteratorFor);

var _iterateOver = require("./utils/iterateOver");

var _iterateOver2 = _interopRequireDefault(_iterateOver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
*/

var KeyedProperty = function (_Property) {
	_inherits(KeyedProperty, _Property);

	function KeyedProperty() {
		var initialState = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var autoShadow = arguments[1];
		var readonly = arguments[2];

		_classCallCheck(this, KeyedProperty);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(KeyedProperty).call(this, initialState, autoShadow, readonly));
	}

	_createClass(KeyedProperty, [{
		key: "addProperty",
		value: function addProperty(name, property, automount) {
			property.setParent(this);

			return this.addPropertyShader(name, property.shader(), property.getInitialState(), automount);
		}
	}, {
		key: "addPropertyClass",
		value: function addPropertyClass(name, propClass, initialState, autoShadow, readonly, automount) {
			var shader = new _PropertyFactoryShader2.default(propClass, this, initialState, autoShadow, readonly, automount);

			return this.addPropertyShader(name, shader, initialState);
		}
	}, {
		key: "addPropertyShader",
		value: function addPropertyShader(name, shader, initialState, automount) {
			// initial state has two sources: parameter and the shader
			initialState = initialState !== undefined ? initialState : shader.initialState ? shader.initialState : this.initialState && this.initialState[name];

			this.shader().add(name, shader, automount);

			if (this.isActive()) {
				if (initialState !== undefined) {
					this.set(name, initialState);
				}

				this.refresh();
			} else {
				this.initialState[name] = initialState;
			}

			// return shader so can be further customized
			return shader;
		}
	}, {
		key: "removeProperty",
		value: function removeProperty(name) {
			this.shader().remove(name);
			this.delete(name);
		}

		//------------------------------------------------------------------------------------------------------
		// State lifecycle methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "getInitialState",
		value: function getInitialState(state) {
			if (this.initialState) {
				// state take precedence
				return _extends({}, this.initialState, state);
			}

			return state;
		}

		//------------------------------------------------------------------------------------------------------
		// Subclasses may want to override thise methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "implementationClass",
		value: function implementationClass() {
			return _KeyedShadowImpl2.default;
		}

		//------------------------------------------------------------------------------------------------------
		// Map and other useful data structure functions
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "clear",
		value: function clear() {
			if (this.isActive()) {
				this.__.clear();
			}
		}
	}, {
		key: "delete",
		value: function _delete(key) {
			if (this.isActive()) {
				var value = this._[key];

				// need to perform action even if value is undefined because could be a queued action
				// to add it.
				this.__.delete(key);

				return value;
			}
		}
	}, {
		key: "entries",
		value: function entries() {
			var _this2 = this;

			if (!this.isActive()) {
				return _doneIterator2.default;
			}

			return (0, _iterateOver2.default)(this.keysArray(), function (key) {
				return [key, _this2.get(key)];
			});
		}
	}, {
		key: "get",
		value: function get(key) {
			if (this.isActive()) {
				return this._[key];
			}
		}
	}, {
		key: "has",
		value: function has(key) {
			if (this.isActive()) {
				return (0, _lodash4.default)(this._, key);
			}
		}
	}, {
		key: "keysArray",
		value: function keysArray() {
			if (!this.isActive()) {
				return _doneIterator2.default;
			}

			return this.__.keys();
		}
	}, {
		key: "keys",
		value: function keys() {
			if (!this.isActive()) {
				return _doneIterator2.default;
			}

			return (0, _iteratorFor2.default)(this.__.keys());
		}
	}, {
		key: "set",
		value: function set(key, value) {
			if (this.isActive()) {
				this.__.set(key, value);
			}
		}
	}, {
		key: "valuesArray",
		value: function valuesArray() {
			if (!this.isActive()) {
				return _doneIterator2.default;
			}

			var keys = this.keysArray();
			var values = [];

			for (var i = 0, len = keys.length; i < len; i++) {
				values.push(this[keys[i]]);
			}

			return values;
		}
	}, {
		key: "values",
		value: function values() {
			var _this3 = this;

			if (!this.isActive()) {
				return _doneIterator2.default;
			}

			return (0, _iterateOver2.default)(this.keysArray(), function (key) {
				return _this3.get(key);
			});
		}
	}, {
		key: Symbol.iterator,
		value: function value() {
			return this.entries();
		}
	}, {
		key: "size",
		get: function get() {
			return this.__.size;
		}
	}]);

	return KeyedProperty;
}(_Property3.default);

//------------------------------------------------------------------------------------------------------
//	Constants and helpers
//------------------------------------------------------------------------------------------------------


exports.default = KeyedProperty;