"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ArrayShadow = require("./ArrayShadow");

var _ArrayShadow2 = _interopRequireDefault(_ArrayShadow);

var _IndexedProperty2 = require("./IndexedProperty");

var _IndexedProperty3 = _interopRequireDefault(_IndexedProperty2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ArrayProperty = function (_IndexedProperty) {
	_inherits(ArrayProperty, _IndexedProperty);

	function ArrayProperty() {
		var initialState = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
		var autoShadow = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
		var readonly = arguments[2];

		_classCallCheck(this, ArrayProperty);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(ArrayProperty).call(this, initialState, autoShadow, readonly));
	}

	//------------------------------------------------------------------------------------------------------
	// Subclasses may want to override thise methods
	//------------------------------------------------------------------------------------------------------

	_createClass(ArrayProperty, [{
		key: "shadowClass",
		value: function shadowClass() {
			return _ArrayShadow2.default;
		}
	}]);

	return ArrayProperty;
}(_IndexedProperty3.default);

exports.default = ArrayProperty;