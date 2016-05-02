"use strict";

exports.__esModule = true;
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lodash = require("lodash.has");

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require("lodash.omit");

var _lodash4 = _interopRequireDefault(_lodash3);

var _lodash5 = require("lodash.isequal");

var _lodash6 = _interopRequireDefault(_lodash5);

var _isObject = require("./utils/isObject");

var _isObject2 = _interopRequireDefault(_isObject);

var _removeFromArray = require("./utils/removeFromArray");

var _removeFromArray2 = _interopRequireDefault(_removeFromArray);

var _ShadowImpl2 = require("./ShadowImpl");

var _ShadowImpl3 = _interopRequireDefault(_ShadowImpl2);

var _reshadow = require("./reshadow");

var _reshadow2 = _interopRequireDefault(_reshadow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// private variable names
var _automounted = Symbol('automounted');
var _impls = Symbol('impls');
var _mapped = Symbol('mapped');
var _nextMapping = Symbol('nextMapping');
var _size = Symbol('size');
var _shadow = Symbol('shadow');

var KeyedShadowImpl = function (_ShadowImpl) {
	_inherits(KeyedShadowImpl, _ShadowImpl);

	function KeyedShadowImpl(time, property, name, state, parent, shader, prev) {
		_classCallCheck(this, KeyedShadowImpl);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(KeyedShadowImpl).call(this, time, property, name, state, parent, shader, prev));

		_this[_mapped] = false;
		_this[_impls] = {};

		/*
  	Define child properties for root properties and copies (prev is defined). The root case is
  	necessary since cannot trigger child property setting on an access through parent property.
  	Mapping properties when 'prev' is set enables the reuse of unchanged shadow properties. This
  	reduces number of objects created and affords use of '===' operator for detecting change.
  */
		if (prev) {
			if (prev && prev[_mapped]) {
				_this.defineChildProperties(prev);
			} else if (prev && Object.keys(prev[_impls]).length) {
				_this.automountChildren(prev);
			}

			// Kill invalid() nodes that are still active
			prev._killInvalidButActiveChildren();
		}
		return _this;
	}

	/*
 	Gets the child implementation mapping (key : impl) for the next state. Use this method to get the
 	mapping when not making changes but just interested in using the next state. This method is more
 	efficient when not making changes because it will use the initial state mapping when no state
 	changes have been made.
 */


	_createClass(KeyedShadowImpl, [{
		key: "childMapping",
		value: function childMapping() {
			return this[_nextMapping] || this[_impls];
		}

		/*
  	Gets the mapping used for making future state changes.
  */

	}, {
		key: "nextMapping",
		value: function nextMapping() {
			if (this[_nextMapping] === undefined) {
				if (!this.isMapped()) {
					this.defineChildProperties();
				}

				this[_nextMapping] = _extends({}, this[_impls]);
			}

			return this[_nextMapping];
		}

		/*
  	Removes a child property from further updates. Child will still be accessible for getting the
  	current value until next update cycle.
  		Parameters:
  		child - the child property implementation instance
  */

	}, {
		key: "removeChild",
		value: function removeChild(child) {
			child.blockFurtherUpdates();
		}

		/*
  	Removes a child property from further updates. Child will still be accessible for getting the
  	current value until next update cycle.
  		Parameters:
  		key - the child property key
  */

	}, {
		key: "removeChildAt",
		value: function removeChildAt(key) {
			var mapping = this.nextMapping();
			var child = mapping[key];

			if (child) {
				this.removeChild(child);
			}
		}
	}, {
		key: "toJSON",
		value: function toJSON() {
			return _extends({}, _get(Object.getPrototypeOf(KeyedShadowImpl.prototype), "toJSON", this).call(this), {
				mapped: this[_mapped],
				type: 'KeyedShadowImpl'
			});
		}

		//------------------------------------------------------------------------------------------------------
		// Methods for access and manipulate subproperties.
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "clear",


		/*
  	Removes all subproperties.
  */
		value: function clear() {
			return this.update(function (state) {
				return { name: "clear()", nextState: {} };
			});
		}

		/*
  	Removes a subproperty from this state property.
  */

	}, {
		key: "delete",
		value: function _delete(key) {
			var _this2 = this;

			this.update(function (state) {
				_this2.removeChildAt(key);

				return { name: "delete(" + key + ")", nextState: (0, _lodash4.default)(state, key) };
			});
		}

		/*
  	Gets a copy of the implementation objects. Returns an object.
  */

	}, {
		key: "entries",
		value: function entries() {
			return _extends({}, this[_impls]);
		}
	}, {
		key: "extend",
		value: function extend() {
			for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) {
				sources[_key] = arguments[_key];
			}

			this.update(function (state) {
				return {
					name: "extend()",
					nextState: Object.assign.apply(Object, [{}, state].concat(sources)),
					replace: true
				};
			});
		}

		/*
  	Gets the property implementation for a state property.
  */

	}, {
		key: "get",
		value: function get(k) {
			return this[_impls][k];
		}

		/*
  	Gets if this state property has a subproperty with a specified name.
  */

	}, {
		key: "has",
		value: function has(k) {
			return (0, _lodash2.default)(this[_impls], k);
		}

		/*
  	Gets the keys of all managed subproperties. Returns an array.
  */

	}, {
		key: "keys",
		value: function keys() {
			return Object.keys(this[_impls]);
		}

		/*
  	Sets a subproperty value. Replaces current state property if one has an identical name.
  */

	}, {
		key: "set",
		value: function set(k, v) {
			var _this3 = this;

			this.update(function (state) {
				_this3.removeChildAt(k);

				return { name: "set(" + k + ")", nextState: _extends({}, state, _defineProperty({}, k, v)) };
			});

			return this;
		}

		/*
  	Gets subproperty implementation objects. Returns an array.
  */

	}, {
		key: "values",
		value: function values() {
			return Object.values(this[_impls]);
		}

		//------------------------------------------------------------------------------------------------------
		//	Methods that must be implemented by subclasses
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "defaults",
		value: function defaults(state) {
			// bail if new state is not an object
			if (!(0, _isObject2.default)(state)) {
				// nothing to do
				return;
			}

			var impls = this.childMapping();
			var keys = Object.keys(impls);
			var stateKeys = Object.keys(state);
			var key, stateValue, child;

			for (var i = 0, len = stateKeys.length; i < len; i++) {
				key = stateKeys[i];
				stateValue = state[key];
				child = impls[key];

				if (child) {
					child.defaults(stateValue);
				} else {
					this.extend(_defineProperty({}, key, stateValue));
				}
			}
		}
	}, {
		key: "merge",
		value: function merge(state) {
			// bail if new state is not an object
			if (!(0, _isObject2.default)(state)) {
				return this.assign(state);
			}

			var impls = this.childMapping();
			var keys = Object.keys(impls);
			var stateKeys = Object.keys(state);
			var key, stateValue, child;

			for (var i = 0, len = stateKeys.length; i < len; i++) {
				key = stateKeys[i];
				child = impls[key];
				stateValue = state[key];

				if (child) {
					child.merge(stateValue);
				} else {
					this.extend(_defineProperty({}, key, stateValue));
				}
			}
		}

		//------------------------------------------------------------------------------------------------------
		//	Methods that subclasses with children must implement
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "automountChildren",
		value: function automountChildren(prev) {
			if (this[_mapped] || this[_automounted]) {
				return;
			}

			this[_automounted] = true;

			var state = this.state;
			var shader = this.shader(state);
			var childShader;

			for (var name in state) {
				if (shader.isAutomount(name)) {
					this.defineChildProperty(name, shader, state, prev);
				}
			}
		}

		/*
  	Subclasses should implement this method in such a way as not to trigger a mapping.
  */

	}, {
		key: "childCount",
		value: function childCount() {
			if (this[_size] === undefined) {
				this[_size] = Object.keys(this.state).length;
			}

			return this[_size];
		}

		/*
  	Gets the implementation objects managed by this property.
  */

	}, {
		key: "children",
		value: function children() {
			return Object.values(this[_impls]);
		}
	}, {
		key: "isMapped",
		value: function isMapped() {
			return this[_mapped];
		}

		/*
  	Gets the keys/indices for this property.
  		Implementation note: Subclasses should implement this method in such a way as not to trigger a mapping.
  */

	}, {
		key: "keys",
		value: function keys() {
			return Object.keys(this.state);
		}

		/*
  	Maps all child properties onto this property using Object.defineProperty().
  */

	}, {
		key: "defineChildProperties",
		value: function defineChildProperties(prev) {
			if (this[_mapped]) {
				return;
			}

			this[_mapped] = true;

			var state = this.state;
			var shader = this.shader(state);
			var child;

			for (var name in state) {
				if (!state.hasOwnProperty(name)) {
					continue;
				}

				this.defineChildProperty(name, shader, state, prev);
			}
		}
	}, {
		key: "_killInvalidButActiveChildren",
		value: function _killInvalidButActiveChildren() {
			// kill any unvisited children from previous implementation
			var prevNames = Object.keys(this[_impls]);
			var child;

			for (var i = 0, len = prevNames.length; i < len; i++) {
				child = this[_impls][prevNames[i]];

				if (!child.isValid() && child.isActive()) {
					child.obsoleteTree();
				}
			}
		}
	}, {
		key: "defineChildProperty",
		value: function defineChildProperty(name, shader, state, prev) {
			// ensure not already defined
			if (this[_impls][name]) {
				return;
			}

			var child;

			var prevChild = prev && prev[_impls][name];
			var childShader = shader.shaderFor(name, state);

			if (!childShader) {
				console.warn("KeyedShadowImpl.defineChildProperties() - no shader found - name=" + name + ", path=" + this.dotPath());
				return;
			}

			if (prevChild) {
				child = (0, _reshadow2.default)(this.time, state, prevChild, this);
			} else {
				child = childShader.shadowProperty(this.time, name, state, this, this.store);
			}

			if (child) {
				this[_impls][name] = child;
			}
		}
	}, {
		key: "size",
		get: function get() {
			return this.childCount();
		}
	}]);

	return KeyedShadowImpl;
}(_ShadowImpl3.default);

exports.default = KeyedShadowImpl;