"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _noParentStateErrorMsg = require("./noParentStateErrorMsg");

var _noParentStateErrorMsg2 = _interopRequireDefault(_noParentStateErrorMsg);

var _PropertyFactoryShader = require("./PropertyFactoryShader");

var _PropertyFactoryShader2 = _interopRequireDefault(_PropertyFactoryShader);

var _isObject = require("./utils/isObject");

var _isObject2 = _interopRequireDefault(_isObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AutoShader = function () {
	function AutoShader(readonly) {
		_classCallCheck(this, AutoShader);

		this.readonly = readonly;
	}

	_createClass(AutoShader, [{
		key: "shaderFor",
		value: function shaderFor(name, state) {
			return this;
		}
	}, {
		key: "shadowProperty",
		value: function shadowProperty(time, name, parentState, parentImpl, store) {
			(0, _invariant2.default)(parentState, (0, _noParentStateErrorMsg2.default)(name, parentImpl));
			(0, _invariant2.default)(parentImpl, "Auto shader properties must have a parent property");

			var state = parentState[name];
			var parentProperty = parentImpl.property;
			var PropertyClass;

			if (Array.isArray(state)) {
				PropertyClass = require("./ArrayProperty").default;
			} else if ((0, _isObject2.default)(state)) {
				PropertyClass = require("./MapProperty").default;
			} else {
				PropertyClass = require("./PrimitiveProperty").default;
			}

			var shader = new _PropertyFactoryShader2.default(PropertyClass, parentProperty, undefined, true, this.readonly);

			return shader.shadowProperty(time, name, parentState, parentImpl);
		}
	}, {
		key: "shouldAutomount",
		value: function shouldAutomount() {
			return this.automount;
		}
	}]);

	return AutoShader;
}();

exports.default = AutoShader;