"use strict";

exports.__esModule = true;
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lodash = require("lodash.range");

var _lodash2 = _interopRequireDefault(_lodash);

var _ShadowImpl2 = require("./ShadowImpl");

var _ShadowImpl3 = _interopRequireDefault(_ShadowImpl2);

var _modelizeArray = require("./modelizeArray");

var _modelizeArray2 = _interopRequireDefault(_modelizeArray);

var _reshadow = require("./reshadow");

var _reshadow2 = _interopRequireDefault(_reshadow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _automounted = Symbol('automounted');
var _impls = Symbol('impls');
var _mapped = Symbol('mapped');
var _length = Symbol('length');
var _nextMapping = Symbol('nextMapping');
var _shadow = Symbol('shadow');

var IndexedShadowImpl = function (_ShadowImpl) {
	_inherits(IndexedShadowImpl, _ShadowImpl);

	function IndexedShadowImpl(time, property, name, state, parent, shader, prev) {
		_classCallCheck(this, IndexedShadowImpl);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(IndexedShadowImpl).call(this, time, property, name, state, parent, shader, prev));

		_this[_mapped] = false;
		_this[_impls] = [];

		// setup the length property
		_this[_length] = state.length;

		// go ahead and map properties so can reuse valid properties without creating a closure reference.
		// Reusing properties allows for React components to do '===' to see if a property has changed.
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

	_createClass(IndexedShadowImpl, [{
		key: "isMapped",
		value: function isMapped() {
			return this[_mapped];
		}
	}, {
		key: "addChildren",
		value: function addChildren(start, num) {
			this[_nextMapping] = this[_nextMapping] || [].concat(this[_impls]);

			var mapping = this[_nextMapping];
			var blanks = [];
			var count = num;

			while (count--) {
				blanks.push(null);
			} // rename children after newly added blanks
			for (var _i = start, len = mapping.length; _i < len; _i++) {
				var idx = _i + num;
				var child = mapping[_i];

				if (child) {
					child.updateName(idx);
				}
			}

			mapping.splice.apply(mapping, [start, 0].concat(blanks));
		}

		/*
  	Its possible for children to move when array items are inserted or removed in update actions.
  */

	}, {
		key: "childMapping",
		value: function childMapping() {
			return this[_nextMapping] ? this[_nextMapping] : this[_impls];
		}
	}, {
		key: "moveChildren",
		value: function moveChildren(start, deleteCount, addCount) {
			this.removeChildren(start, deleteCount);
			this.addChildren(start, addCount);
		}
	}, {
		key: "removeChildren",
		value: function removeChildren(start, num) {
			this[_nextMapping] = this[_nextMapping] || [].concat(this[_impls]);

			var mapping = this[_nextMapping];

			// prevent changes in removed children
			for (var _i2 = 0; _i2 < num; _i2++) {
				var child = mapping[start + _i2];

				if (child) {
					child.blockFurtherUpdates();
				}
			}

			// remove children from mapping
			mapping.splice(start, num);

			// rename remaining children
			for (var _i3 = start, len = mapping.length; _i3 < len; _i3++) {
				var _child = mapping[_i3];

				if (_child) {
					_child.updateName(_i3);
				}
			}
		}
	}, {
		key: "toJSON",
		value: function toJSON() {
			return _extends({}, _get(Object.getPrototypeOf(IndexedShadowImpl.prototype), "toJSON", this).call(this), {
				type: 'ArrayImpl',
				length: this.length,
				mapped: this[_mapped]
			});
		}

		//------------------------------------------------------------------------------------------------------
		//	Methods for access and manipulate subproperties - based on Array methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "clear",


		/*
  	Removes all subproperties.
  */
		value: function clear() {
			this.assign([], "clear()");
		}
	}, {
		key: "childAt",
		value: function childAt(idx) {
			return this[_impls][i];
		}

		// This method does not change this object's state.

	}, {
		key: "concat",
		value: function concat() {
			for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
				values[_key] = arguments[_key];
			}

			(0, _modelizeArray2.default)(values);

			this.update(function (state) {
				return { nextState: state.contcat(values) };
			});

			return [].concat(this.nextState());
		}
	}, {
		key: "pop",
		value: function pop() {
			var _this2 = this;

			var result;

			this.update(function (state) {
				var lastIdx = state.length - 1;

				state = [].concat(state);
				result = state.pop();

				if (lastIdx != -1) {
					_this2.removeChildren(lastIdx, 1);
				}

				return { name: "pop()", nextState: state };
			});

			// value is no longer being managed so ok to return without cloning
			return result;
		}
	}, {
		key: "push",
		value: function push() {
			for (var _len2 = arguments.length, values = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
				values[_key2] = arguments[_key2];
			}

			var result;

			(0, _modelizeArray2.default)(values);

			this.update(function (state) {
				var _state;

				state = [].concat(state);
				result = (_state = state).push.apply(_state, values);

				// no need to update children mapping only affecting tail

				return { name: "push()", nextState: state };
			});

			return result;
		}
	}, {
		key: "remove",
		value: function remove(idx) {
			var _this3 = this;

			var result;

			this.update(function (state) {
				state = [].concat(state);
				result = state.splice(idx, 1);

				_this3.removeChildren(idx, 1);

				return { name: "remove(" + idx + ")", nextState: state };
			});

			// value is no longer being managed so ok to return without cloning
			return result[0];
		}
	}, {
		key: "shift",
		value: function shift() {
			var _this4 = this;

			var result;

			this.update(function (state) {
				state = [].concat(state);
				result = state.shift();

				_this4.removeChildren(0, 1);

				return { name: "shift()", nextState: state };
			});

			// value is no longer being managed so ok to return without cloning
			return result;
		}
	}, {
		key: "splice",
		value: function splice(start, deleteCount) {
			for (var _len3 = arguments.length, newItems = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
				newItems[_key3 - 2] = arguments[_key3];
			}

			var _this5 = this;

			var result;

			(0, _modelizeArray2.default)(newItems);

			this.update(function (state) {
				var _state2;

				state = [].concat(state);

				result = (_state2 = state).splice.apply(_state2, [start, deleteCount].concat(newItems));
				_this5.moveChildren(start, deleteCount, newItems.length);

				return { name: "splice(" + start + ", " + deleteCount + ", ...)", nextState: state };
			});

			// values is no longer being managed so ok to return without cloning
			return result;
		}
	}, {
		key: "unshift",
		value: function unshift() {
			var _this6 = this;

			for (var _len4 = arguments.length, values = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
				values[_key4] = arguments[_key4];
			}

			var result;

			(0, _modelizeArray2.default)(values);

			this.update(function (state) {
				var _state3;

				state = [].concat(state);
				result = (_state3 = state).unshift.apply(_state3, values);

				_this6.addChildren(0, values.length);

				return { name: "unshift()", nextState: state };
			});

			// values are no longer being managed so ok to return without cloning
			return result;
		}
	}, {
		key: "values",
		value: function values() {
			return [].concat(this[_impls]);
		}

		//------------------------------------------------------------------------------------------------------
		//	Methods that must be implemented by subclasses
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "defaults",
		value: function defaults(newItems) {
			var _this7 = this;

			if (!Array.isArray(newItems)) {
				// nothing to do
				return;
			}

			var impls = this.childMapping();
			var child, value;

			var _loop = function _loop(len, _i4) {
				child = impls[_i4];
				value = newItems[_i4];

				if (child) {
					child.defaults(value);
				} else {
					_this7.update(function (state) {
						state = [].concat(state);

						state.splice(_i4, 0, value);
						_this7.addChildren(_i4, newItems.length);

						return { nextState: state };
					});
				}
			};

			for (var _i4 = 0, len = newItems.length; _i4 < len; _i4++) {
				_loop(len, _i4);
			}
		}
	}, {
		key: "merge",
		value: function merge(newItems) {
			var _this8 = this;

			if (!Array.isArray(newItems)) {
				return this.assign(newItems);
			}

			var impls = this.childMapping();
			var child, value;

			var _loop2 = function _loop2(len, _i5) {
				child = impls[_i5];
				value = newItems[_i5];

				if (child) {
					child.merge(value);
				} else {
					_this8.update(function (state) {
						state = [].concat(state);

						state.splice(_i5, 0, value);
						_this8.addChildren(_i5, newItems.length);

						return { nextState: state };
					});
				}
			};

			for (var _i5 = 0, len = newItems.length; _i5 < len; _i5++) {
				_loop2(len, _i5);
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

			for (var _i6 = 0, len = state.length; _i6 < len; _i6++) {
				if (shader.isAutomount(_i6)) {
					this.defineChildProperty(_i6, shader, state, prev);
				}
			}
		}

		/*
  	Subclasses should implement this method in such a way as not to trigger a mapping.
  */

	}, {
		key: "childCount",
		value: function childCount() {
			return this[_length];
		}

		/*
  	Gets the implementation objects managed by this property.
  */

	}, {
		key: "children",
		value: function children() {
			return [].concat(this[_impls]);
		}

		/*
  	Gets the keys/indices for this property.
  		Implementation note: Subclasses should implement this method in such a way as not to trigger a mapping.
  */

	}, {
		key: "keys",
		value: function keys() {
			if (!this._keys) {
				this._keys = (0, _lodash2.default)(this.length);
			}

			return this._keys;
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

			var shader = this.shader(state);
			var state = this.state;

			for (var _i7 = 0, len = state.length; _i7 < len; _i7++) {
				this.defineChildProperty(_i7, shader, state, prev);
			}
		}
	}, {
		key: "_killInvalidButActiveChildren",
		value: function _killInvalidButActiveChildren() {
			// kill any unvisited children
			var children = this.children();
			var child;

			for (var _i8 = 0, len = children.length; _i8 < len; _i8++) {
				child = children[_i8];

				if (!child.isValid() && child.isActive()) {
					child.obsoleteTree();
				}
			}
		}
	}, {
		key: "defineChildProperty",
		value: function defineChildProperty(idx, shader, state, prev) {
			// ensure not already defined
			if (this[_impls][idx]) {
				return;
			}

			var childShader = shader.shaderFor(idx, state);
			var prevMapping = prev && prev.childMapping();
			var prevChild = prevMapping && prevMapping[idx];
			var child;

			if (prevChild) {
				child = (0, _reshadow2.default)(this.time, state, prevChild, this);
			} else {
				child = childShader.shadowProperty(this.time, idx, state, this, this.store);
			}

			if (child) {
				this[_impls][idx] = child;
			}
		}
	}, {
		key: "length",
		get: function get() {
			return this[_length];
		}
	}]);

	return IndexedShadowImpl;
}(_ShadowImpl3.default);

exports.default = IndexedShadowImpl;