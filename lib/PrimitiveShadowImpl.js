"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash.isequal");

var _lodash2 = _interopRequireDefault(_lodash);

var _ShadowImpl2 = require("./ShadowImpl");

var _ShadowImpl3 = _interopRequireDefault(_ShadowImpl2);

var _PrimitiveShadow = require("./PrimitiveShadow");

var _PrimitiveShadow2 = _interopRequireDefault(_PrimitiveShadow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PrimitiveShadowImpl = function (_ShadowImpl) {
	_inherits(PrimitiveShadowImpl, _ShadowImpl);

	function PrimitiveShadowImpl() {
		_classCallCheck(this, PrimitiveShadowImpl);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(PrimitiveShadowImpl).apply(this, arguments));
	}

	_createClass(PrimitiveShadowImpl, [{
		key: "defaults",

		//------------------------------------------------------------------------------------------------------
		//	Methods that must be implemented by subclasses
		//------------------------------------------------------------------------------------------------------

		value: function defaults(state) {
			if (this.state === undefined) {
				this.assign(state);
			}
		}
	}, {
		key: "definePropertyGetValue",
		value: function definePropertyGetValue(state) {
			return this.property.definePropertyGetValue(state);
		}
	}, {
		key: "definePropertySetValue",
		value: function definePropertySetValue(newValue) {
			this.property.definePropertySetValue(newValue);
		}
	}, {
		key: "isPrimitive",
		value: function isPrimitive() {
			return true;
		}
	}, {
		key: "merge",
		value: function merge(state) {
			if (!(0, _lodash2.default)(state, this.state)) {
				this.assign(state);
			}
		}
	}, {
		key: "shadow",
		value: function shadow() {
			if (!this._shadow) {
				this._shadow = new _PrimitiveShadow2.default(this);
			}

			return this._shadow;
		}
	}]);

	return PrimitiveShadowImpl;
}(_ShadowImpl3.default);

exports.default = PrimitiveShadowImpl;