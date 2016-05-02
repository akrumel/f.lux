"use strict";

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = createArrayPropertyType;

var _ArrayProperty2 = require("./ArrayProperty");

var _ArrayProperty3 = _interopRequireDefault(_ArrayProperty2);

var _ArrayShadow2 = require("./ArrayShadow");

var _ArrayShadow3 = _interopRequireDefault(_ArrayShadow2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
	Creates an ArrayProperty subclass based on a custom Shadow type.
*/
function createArrayPropertyType(shadowType, stateSpec) {
	var ShadowClass;

	// get the shadow class
	if (shadowType instanceof _ArrayShadow3.default) {
		// shadow class passed into method
		ShadowClass = shadowType;
	} else {
		var CustomArrayShadow = function (_ArrayShadow) {
			_inherits(CustomArrayShadow, _ArrayShadow);

			function CustomArrayShadow() {
				_classCallCheck(this, CustomArrayShadow);

				return _possibleConstructorReturn(this, Object.getPrototypeOf(CustomArrayShadow).apply(this, arguments));
			}

			return CustomArrayShadow;
		}(_ArrayShadow3.default);

		var proto = CustomArrayShadow.prototype;
		var names = Object.getOwnPropertyNames(shadowType);
		var name, desc;

		for (var i = 0, len = names.length; i < len; i++) {
			name = names[i];
			desc = Object.getOwnPropertyDescriptor(shadowType, name);

			if (name !== "__stateSpec__") {
				Object.defineProperty(proto, name, desc);
			} else {
				// embedded stateSpec
				CustomArrayShadow.stateSpec = shadowType.__stateSpec__ || shadowType.stateSpec;
			}
		}

		ShadowClass = CustomArrayShadow;
	}

	// create the property subclass

	var CustomArrayProperty = function (_ArrayProperty) {
		_inherits(CustomArrayProperty, _ArrayProperty);

		function CustomArrayProperty(defaults, autoShadow, readonly) {
			_classCallCheck(this, CustomArrayProperty);

			return _possibleConstructorReturn(this, Object.getPrototypeOf(CustomArrayProperty).call(this, defaults, autoShadow, readonly));
		}

		_createClass(CustomArrayProperty, [{
			key: "shadowClass",
			value: function shadowClass() {
				return ShadowClass;
			}
		}]);

		return CustomArrayProperty;
	}(_ArrayProperty3.default);

	// assign state spec if present to new Property subclass


	CustomArrayProperty.stateSpec = ShadowClass.stateSpec || stateSpec;

	return CustomArrayProperty;
}