"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _IndexedShadow = require("./IndexedShadow");

var _IndexedShadow2 = _interopRequireDefault(_IndexedShadow);

var _IndexedShadowImpl = require("./IndexedShadowImpl");

var _IndexedShadowImpl2 = _interopRequireDefault(_IndexedShadowImpl);

var _Property2 = require("./Property");

var _Property3 = _interopRequireDefault(_Property2);

var _PropertyFactoryShader = require("./PropertyFactoryShader");

var _PropertyFactoryShader2 = _interopRequireDefault(_PropertyFactoryShader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _propertyShader = Symbol('propertyClass');

var IndexedProperty = function (_Property) {
	_inherits(IndexedProperty, _Property);

	function IndexedProperty() {
		var initialState = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
		var autoShadow = arguments[1];
		var readonly = arguments[2];

		_classCallCheck(this, IndexedProperty);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(IndexedProperty).call(this, initialState, autoShadow, readonly));
	}

	_createClass(IndexedProperty, [{
		key: "clearValueShader",
		value: function clearValueShader() {
			this.shader().setChildShader(null);
		}
	}, {
		key: "setValueShader",
		value: function setValueShader(propertyClass, initialState, autoShadow) {
			var readonly = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

			var shader = new _PropertyFactoryShader2.default(propertyClass, this, initialState, autoShadow, readonly);

			this.shader().setChildShader(shader);
		}

		//------------------------------------------------------------------------------------------------------
		// State lifecycle methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "getInitialState",
		value: function getInitialState(state) {
			if (this.initialState) {
				var initState = [].concat(this.initialState);

				if (state && Array.isArray(state)) {
					for (var i = 0, len = state.length; i < len; i++) {
						initState[i] = state[i];
					}
				}

				return initState;
			}

			return state;
		}

		//------------------------------------------------------------------------------------------------------
		// Subclasses may want to override thise methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "implementationClass",
		value: function implementationClass() {
			return _IndexedShadowImpl2.default;
		}
	}, {
		key: "shadowClass",
		value: function shadowClass() {
			return _IndexedShadow2.default;
		}

		//------------------------------------------------------------------------------------------------------
		// Array and other child manipulation functions
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "clear",


		// Select Array methods (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
		value: function clear() {
			if (this.isActive()) {
				this.__.clear();
			}
		}
	}, {
		key: "concat",
		value: function concat() {
			if (this.isActive()) {
				var _;

				return (_ = this.__).concat.apply(_, arguments);
			}
		}
	}, {
		key: "pop",
		value: function pop() {
			if (this.isActive()) {
				return this.__.pop();
			}
		}
	}, {
		key: "push",
		value: function push() {
			if (this.isActive()) {
				var _2;

				return (_2 = this.__).push.apply(_2, arguments);
			}
		}
	}, {
		key: "remove",
		value: function remove(idx) {
			if (this.isActive()) {
				return this.__.remove(idx);
			}
		}
	}, {
		key: "shift",
		value: function shift() {
			if (this.isActive()) {
				return this.__.shift();
			}
		}
	}, {
		key: "splice",
		value: function splice(start, deleteCount) {
			if (this.isActive()) {
				var _3;

				for (var _len = arguments.length, newItems = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
					newItems[_key - 2] = arguments[_key];
				}

				return (_3 = this.__).splice.apply(_3, [start, deleteCount].concat(newItems));
			}
		}
	}, {
		key: "unshift",
		value: function unshift() {
			if (this.isActive()) {
				var _4;

				return (_4 = this.__).unshift.apply(_4, arguments);
			}
		}
	}, {
		key: "length",
		get: function get() {
			return this.__.length;
		}
	}]);

	return IndexedProperty;
}(_Property3.default);

exports.default = IndexedProperty;