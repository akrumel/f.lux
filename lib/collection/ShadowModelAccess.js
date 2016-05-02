"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Access2 = require("../Access");

var _Access3 = _interopRequireDefault(_Access2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ShadowModelAccess = function (_Access) {
	_inherits(ShadowModelAccess, _Access);

	function ShadowModelAccess(modelProperty, impl) {
		_classCallCheck(this, ShadowModelAccess);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ShadowModelAccess).call(this, impl));

		Object.defineProperty(_this, '$$', { enumerable: true, value: modelProperty });
		return _this;
	}

	/*
 	Returns a ShadowModelAccess so any subproperties will have a ShadowModelAccess accessor.
 */


	_createClass(ShadowModelAccess, [{
		key: "create$ForChild",
		value: function create$ForChild(childImpl) {
			return new ShadowModelAccess(this.$$, childImpl);
		}
	}, {
		key: "destroy",
		value: function destroy() {
			return this.$$.destroy();
		}
	}, {
		key: "isNew",
		value: function isNew() {
			return this.$$.isNew();
		}
	}, {
		key: "save",
		value: function save() {
			return this.$$.save();
		}
	}, {
		key: "collection",
		get: function get() {
			return this.$$.collection.state;
		}
	}, {
		key: "dirty",
		get: function get() {
			return this.$$.dirty;
		}
	}, {
		key: "id",
		get: function get() {
			return this.$$.id;
		}
	}]);

	return ShadowModelAccess;
}(_Access3.default);

exports.default = ShadowModelAccess;