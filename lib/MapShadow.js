"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Shadow2 = require("./Shadow");

var _Shadow3 = _interopRequireDefault(_Shadow2);

var _iteratorFor = require("./utils/iteratorFor");

var _iteratorFor2 = _interopRequireDefault(_iteratorFor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*

*/

var MapShadow = function (_Shadow) {
	_inherits(MapShadow, _Shadow);

	function MapShadow(impl) {
		_classCallCheck(this, MapShadow);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(MapShadow).call(this, impl));
	}

	//------------------------------------------------------------------------------------------------------
	// Select Map methods (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
	//------------------------------------------------------------------------------------------------------

	_createClass(MapShadow, [{
		key: "clear",
		value: function clear() {
			this.__.clear();
		}
	}, {
		key: "delete",
		value: function _delete(key) {
			return this.__.delete(key);
		}
	}, {
		key: "entries",
		value: function entries() {
			var _this2 = this;

			return iterateOver(this.__.keys(), function (key) {
				return [key, _this2[key]];
			});
		}
	}, {
		key: "get",
		value: function get(key) {
			return this[key];
		}
	}, {
		key: "has",
		value: function has(key) {
			return this.__.has(key);
		}
	}, {
		key: "keys",
		value: function keys() {
			return (0, _iteratorFor2.default)(this.__.keys());
		}
	}, {
		key: "set",
		value: function set(key, value) {
			return this.__.set(key, value);
		}
	}, {
		key: "values",
		value: function values() {
			var _this3 = this;

			return iterateOver(this.__.keys(), function (key) {
				return _this3[key];
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

	return MapShadow;
}(_Shadow3.default);

exports.default = MapShadow;