"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _IndexedShadow2 = require("./IndexedShadow");

var _IndexedShadow3 = _interopRequireDefault(_IndexedShadow2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ArrayShadow = function (_IndexedShadow) {
	_inherits(ArrayShadow, _IndexedShadow);

	function ArrayShadow() {
		_classCallCheck(this, ArrayShadow);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(ArrayShadow).apply(this, arguments));
	}

	_createClass(ArrayShadow, [{
		key: "clear",
		value: function clear() {
			this.__.clear();
		}

		//------------------------------------------------------------------------------------------------------
		//	Write capable array methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "concat",
		value: function concat() {
			var _;

			return (_ = this.__).concat.apply(_, arguments);
		}
	}, {
		key: "pop",
		value: function pop() {
			return this.__.pop();
		}
	}, {
		key: "push",
		value: function push() {
			var _2;

			return (_2 = this.__).push.apply(_2, arguments);
		}
	}, {
		key: "remove",
		value: function remove(idx) {
			return this.__.remove(idx);
		}
	}, {
		key: "removeValue",
		value: function removeValue(value) {
			var idx = this.indexOf(value);

			if (idx != -1) {
				this.remove(idx);
			}
		}
	}, {
		key: "shift",
		value: function shift() {
			return this.__.shift();
		}
	}, {
		key: "splice",
		value: function splice(start, deleteCount) {
			var _3;

			for (var _len = arguments.length, newItems = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
				newItems[_key - 2] = arguments[_key];
			}

			return (_3 = this.__).splice.apply(_3, [start, deleteCount].concat(newItems));
		}
	}, {
		key: "unshift",
		value: function unshift() {
			var _4;

			return (_4 = this.__).unshift.apply(_4, arguments);
		}
	}]);

	return ArrayShadow;
}(_IndexedShadow3.default);

exports.default = ArrayShadow;