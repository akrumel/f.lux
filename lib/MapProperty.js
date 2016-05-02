"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _KeyedProperty2 = require("./KeyedProperty");

var _KeyedProperty3 = _interopRequireDefault(_KeyedProperty2);

var _MapShadow = require("./MapShadow");

var _MapShadow2 = _interopRequireDefault(_MapShadow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
	Exposes a Map interface on a shadow property. The Map API is exposed throught in MapShadow, which uses 
	the KeyedProperty methods for implementation. 
*/

var MapProperty = function (_KeyedProperty) {
	_inherits(MapProperty, _KeyedProperty);

	function MapProperty() {
		var initialState = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var autoShadow = arguments[1];
		var readonly = arguments[2];

		_classCallCheck(this, MapProperty);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(MapProperty).call(this, initialState, autoShadow, readonly));
	}

	//------------------------------------------------------------------------------------------------------
	// Subclasses may want to override thise methods
	//------------------------------------------------------------------------------------------------------

	_createClass(MapProperty, [{
		key: "shadowClass",
		value: function shadowClass() {
			return _MapShadow2.default;
		}
	}]);

	return MapProperty;
}(_KeyedProperty3.default);

exports.default = MapProperty;