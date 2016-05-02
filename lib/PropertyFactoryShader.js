"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.configureShader = configureShader;

var _noParentStateErrorMsg = require("./noParentStateErrorMsg");

var _noParentStateErrorMsg2 = _interopRequireDefault(_noParentStateErrorMsg);

var _Shader = require("./Shader");

var _Shader2 = _interopRequireDefault(_Shader);

var _assert = require("./utils/assert");

var _assert2 = _interopRequireDefault(_assert);

var _isSomething = require("./utils/isSomething");

var _isSomething2 = _interopRequireDefault(_isSomething);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PropertyFactoryShader = function () {
	/*
 	Creates a factory that will create a shader for instantiating shadow properties for a property type.
 		Parameters:
 		PropertyClass - the Property subclass's class
 		parent - the parent Property instance (not ShadowImpl subclass)
 */

	function PropertyFactoryShader(PropertyClass, parent, defaults, autoShadow, readonly) {
		_classCallCheck(this, PropertyFactoryShader);

		this.PropertyClass = PropertyClass;
		this.parent = parent;
		this.defaults = defaults;
		this.autoShadow = autoShadow;
		this.readonly = readonly;
	}

	_createClass(PropertyFactoryShader, [{
		key: "setElementClass",
		value: function setElementClass(PropertyClass, defaults, autoShadow, readonly) {
			this.childShaderDefn = {
				PropertyClass: PropertyClass,
				defaults: defaults,
				autoShadow: autoShadow,
				readonly: readonly
			};
		}
	}, {
		key: "setElementStateType",
		value: function setElementStateType(stateType) {
			this.childShaderDefn = stateType;
		}
	}, {
		key: "addPropertyClass",
		value: function addPropertyClass(name, PropertyClass, defaults, autoShadow, readonly) {
			if (!this.propertyShaderDefn) {
				this.propertyShaderDefn = {};
			}

			this.propertyShaderDefn[name] = {
				PropertyClass: PropertyClass,
				defaults: defaults,
				autoShadow: autoShadow,
				readonly: readonly
			};
		}
	}, {
		key: "addStateType",
		value: function addStateType(name, stateType) {
			if (!this.propertyShaderDefn) {
				this.propertyShaderDefn = {};
			}

			this.propertyShaderDefn[name] = stateType;
		}
	}, {
		key: "shadowProperty",
		value: function shadowProperty(time, name, parentState, parentImpl) {
			var _this = this;

			(0, _assert2.default)(function (a) {
				return a.is(parentState || !_this.parent, (0, _noParentStateErrorMsg2.default)(name, parentImpl));
			});

			// this should never happen but lets be safe
			if (!(0, _isSomething2.default)(parentState)) {
				console.warn(this.noParentStateErrorMsg(name, parentImpl));

				return null;
			}

			var property = new this.PropertyClass(this.defaults, this.autoShadow);
			var shader = new _Shader2.default(property, property.autoShadow);

			var _require = require("./StateTypes");

			var StateType = _require.StateType;


			configureShader(property, shader);

			property._setShader(shader);

			if (this.childShaderDefn) {
				if (this.childShaderDefn instanceof StateType) {
					shader.setChildShader(this.childShaderDefn.factory(property));
				} else {
					var _childShaderDefn = this.childShaderDefn;
					var PropertyClass = _childShaderDefn.PropertyClass;
					var defaults = _childShaderDefn.defaults;
					var autoShadow = _childShaderDefn.autoShadow;
					var readonly = _childShaderDefn.readonly;


					shader.setElementClass(PropertyClass, defaults, autoShadow, readonly);
				}
			} else if (this.propertyShaderDefn) {
				var keys = Object.keys(this.propertyShaderDefn);

				for (var i = 0, len = keys.length; i < len; i++) {
					var key = keys[i];
					var defn = this.propertyShaderDefn[key];

					if (defn instanceof StateType) {
						shader.add(key, defn.factory(property));
					} else {
						var _PropertyClass = defn.PropertyClass;
						var _defaults = defn.defaults;
						var _autoShadow = defn.autoShadow;
						var _readonly = defn.readonly;


						shader.addPropertyClass(key, _PropertyClass, _defaults, _autoShadow, _readonly);
					}
				}
			}

			if (this.readonly) {
				property.setReadonly(true);
			}

			// set the proprety's parent property
			property.setParent(this.parent);

			return shader.shadowProperty(time, name, parentState, parentImpl);
		}
	}, {
		key: "shouldAutomount",
		value: function shouldAutomount() {
			return this.PropertyClass.constructor.shouldAutomount && this.PropertyClass.constructor.shouldAutomount();
		}
	}]);

	return PropertyFactoryShader;
}();

exports.default = PropertyFactoryShader;
function configureShader(property, shader) {
	var proto = property;
	var spec;

	// walk the prototype chain looking for ctor.stateSpec properties
	while (proto = Object.getPrototypeOf(proto)) {
		// check if stateSpec variable defined for Property type
		if (!proto.constructor.stateSpec) {
			continue;
		}

		spec = proto.constructor.stateSpec;

		if (spec instanceof StateType) {
			// child spec
			shader.setChildShader(spec.factory(property));
		} else {
			// iterate keys and add data types
			for (var key in spec) {
				shader.add(key, spec[key].factory(property));
			}
		}
	}
}