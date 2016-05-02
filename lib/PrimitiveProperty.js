"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash.clonedeep");

var _lodash2 = _interopRequireDefault(_lodash);

var _PrimitiveShadowImpl = require("./PrimitiveShadowImpl");

var _PrimitiveShadowImpl2 = _interopRequireDefault(_PrimitiveShadowImpl);

var _Property2 = require("./Property");

var _Property3 = _interopRequireDefault(_Property2);

var _isPrimitive = require("./utils/isPrimitive");

var _isPrimitive2 = _interopRequireDefault(_isPrimitive);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PrimitiveProperty = function (_Property) {
	_inherits(PrimitiveProperty, _Property);

	function PrimitiveProperty(initialState) {
		var autoShadow = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
		var readonly = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

		_classCallCheck(this, PrimitiveProperty);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(PrimitiveProperty).call(this, initialState, autoShadow, readonly));
	}

	//------------------------------------------------------------------------------------------------------
	// PrimitiveProperty subclasses may want to override thise methods
	//------------------------------------------------------------------------------------------------------

	/*
 	Invoked by PrimitiveShadowImpl::definePropertyGetValue() to get the value to return when this property
 	is accessed through the parent property's shadow. Subclasses can override this method to convert
 	the raw state value to another form (Date, URL, enumeration) or contrain it in some way (min/max,
 	uppercase, regular expression).
 		Note: Ensure mutations to the value returned will not affect the state parameter passed into the
 	 	method as the state paremeter is contained in the store's state value.
 		Parameters
 		state - the raw state value (not a shadow)
 		Returns - this base implementation returns the state parameter if it is a primitive and a deep clone
 		otherwise
 */


	_createClass(PrimitiveProperty, [{
		key: "definePropertyGetValue",
		value: function definePropertyGetValue(state) {
			return (0, _isPrimitive2.default)(state) ? state : (0, _lodash2.default)(state);
		}
	}, {
		key: "definePropertySetValue",
		value: function definePropertySetValue(newValue) {
			this.__.assign(newValue);
		}

		//------------------------------------------------------------------------------------------------------
		// Property subclasses may want to override thise methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "implementationClass",
		value: function implementationClass() {
			return _PrimitiveShadowImpl2.default;
		}
	}, {
		key: "shadowClass",
		value: function shadowClass() {
			return _PrimitiveShadowImpl2.default;
		}
	}]);

	return PrimitiveProperty;
}(_Property3.default);

exports.default = PrimitiveProperty;