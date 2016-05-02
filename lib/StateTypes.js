"use strict";

exports.__esModule = true;
exports.StateType = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ArrayProperty = require("./ArrayProperty");

var _ArrayProperty2 = _interopRequireDefault(_ArrayProperty);

var _PropertyFactoryShader = require("./PropertyFactoryShader");

var _PropertyFactoryShader2 = _interopRequireDefault(_PropertyFactoryShader);

var _PrimitiveProperty = require("./PrimitiveProperty");

var _PrimitiveProperty2 = _interopRequireDefault(_PrimitiveProperty);

var _MapProperty = require("./MapProperty");

var _MapProperty2 = _interopRequireDefault(_MapProperty);

var _Shader = require("./Shader");

var _Shader2 = _interopRequireDefault(_Shader);

var _CollectionProperty = require("./collection/CollectionProperty");

var _CollectionProperty2 = _interopRequireDefault(_CollectionProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
	Todo:
		- add managed property type support to factory shader
		- attach shader to constructor so shared. Change will require passing property into each call
		  so may not be worth effort. Would need to get rid of KeyedProperty.addProperty() methods.
*/

var StateType = exports.StateType = function () {
	function StateType(PropertyClass) {
		_classCallCheck(this, StateType);

		this._PropertyClass = PropertyClass;
		this._properties = {};
		this._elementType = null;
	}

	_createClass(StateType, [{
		key: "factory",
		value: function factory(property) {
			var shader = new _PropertyFactoryShader2.default(this._PropertyClass, property, this._defaults, this._autoShadow, this._readonly, this._automount);

			this._setupShader(shader);

			return shader;
		}
	}, {
		key: "shader",
		value: function shader(property) {
			var shader = new _Shader2.default(property, property.autoShadow);

			this._setupShader(shader);

			return shader;
		}
	}, {
		key: "addProperty",
		value: function addProperty(name, type) {
			this._properties[name] = type;
		}
	}, {
		key: "defaults",
		value: function defaults(state) {
			this._defaults = state;

			return this;
		}
	}, {
		key: "isComplex",
		value: function isComplex() {
			return Object.keys(this._properties).length || this._managedPropertyType || this._elementType;
		}
	}, {
		key: "setElementType",
		value: function setElementType(elementType) {
			this._elementType = elementType;
		}
	}, {
		key: "_setupShader",
		value: function _setupShader(shader) {
			if (this._elementType) {
				var eltType = this._elementType;

				if (eltType.isComplex()) {
					shader.setElementStateType(eltType);
				} else {
					shader.setElementClass(eltType.PropertyClass, eltType.defaults, eltType.autoShadow, eltType.readonly);
				}
			} else if (this._managedPropertyType) {
				// will call the setElementType() method after property created - will need to add
				// functionality to the factory shader

				// ADD setManagedPropertyType() TO FACTORY - requires changes to Collection first

				shader.setManagedPropertyType(this._managedPropertyType);
			} else {
				var _eltType = void 0;

				for (var name in this._properties) {
					_eltType = this._properties[name];

					if (_eltType.isComplex()) {
						// complex definition so need to pass entire definition to shader so can handle recusively
						shader.addStateType(name, _eltType);
					} else {
						shader.addPropertyClass(name, _eltType._PropertyClass, _eltType._defaults, _eltType._autoShadow, _eltType._readonly);
					}
				}
			}
		}
	}, {
		key: "autoshadow",
		get: function get() {
			this._autoshadow = true;

			return this;
		}
	}, {
		key: "autoshadowOff",
		get: function get() {
			this._autoshadow = false;

			return false;
		}
	}, {
		key: "readonly",
		get: function get() {
			this._readonly = true;

			return this;
		}
	}, {
		key: "readonlyOff",
		get: function get() {
			this._readonly = false;

			return this;
		}
	}], [{
		key: "shaderFromSpec",
		value: function shaderFromSpec(property, stateSpec) {
			var shader = new _Shader2.default(property, property.autoShadow);
			var eltType;

			debugger;
			for (var name in stateSpec) {
				eltType = this._properties[name];

				if (eltType.isComplex()) {
					// complex definition so need to pass entire definition to shader so can handle recusively
					shader.addStateType(name, eltType);
				} else {
					shader.addPropertyClass(name, eltType._PropertyClass, eltType._defaults, eltType._autoShadow, eltType._readonly);
				}
			}

			return shader;
		}
	}]);

	return StateType;
}();

exports.default = {
	get Primitive() {
		return new StateType(_PrimitiveProperty2.default);
	},

	get Array() {
		var type = new StateType(_ArrayProperty2.default);

		return type;
	},

	arrayOf: function arrayOf(elementStateType) {
		var type = new StateType(_ArrayProperty2.default);

		type.setElementType(elementStateType);

		return type;
	},
	collectionOf: function collectionOf(elementStateType) {
		var type = new StateType(_CollectionProperty2.default);

		// will call the setElementType() method after property created - will need to add
		// functionality to the factory shader
		type.setManagedPropertyType(elementStateType);

		return type;
	},
	map: function map() {
		var defn = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		var type = new StateType(_MapProperty2.default);
		var propType;

		for (var key in defn) {
			propType = defn[key];

			type.addProperty(key, defn[key]);
		}

		return type;
	},
	mapOf: function mapOf(elementStateType) {
		var type = new StateType(_MapProperty2.default);

		type.setElementType(elementStateType);

		return type;
	},
	property: function property(PropertyClass) {
		return new StateType(PropertyClass);
	}
};