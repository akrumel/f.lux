"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Access2 = require("../Access");

var _Access3 = _interopRequireDefault(_Access2);

var _ShadowModelAccess = require("./ShadowModelAccess");

var _ShadowModelAccess2 = _interopRequireDefault(_ShadowModelAccess);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ModelAccess = function (_Access) {
	_inherits(ModelAccess, _Access);

	function ModelAccess() {
		_classCallCheck(this, ModelAccess);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(ModelAccess).apply(this, arguments));
	}

	_createClass(ModelAccess, [{
		key: "create$ForChild",

		/*
  	Sets up a continuous chain of ShadowModelAccess accessors for the model
  */
		value: function create$ForChild(childImpl) {
			if (childImpl.name == "data") {
				return new _ShadowModelAccess2.default(this.__.property, childImpl);
			} else {
				return new _Access3.default(childImpl);
			}
		}
	}]);

	return ModelAccess;
}(_Access3.default);

exports.default = ModelAccess;