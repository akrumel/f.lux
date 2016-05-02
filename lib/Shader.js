"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _AutoShader = require("./AutoShader");

var _AutoShader2 = _interopRequireDefault(_AutoShader);

var _noParentStateErrorMsg = require("./noParentStateErrorMsg");

var _noParentStateErrorMsg2 = _interopRequireDefault(_noParentStateErrorMsg);

var _PropertyFactoryShader = require("./PropertyFactoryShader");

var _PropertyFactoryShader2 = _interopRequireDefault(_PropertyFactoryShader);

var _shadowProperty2 = require("./shadowProperty");

var _shadowProperty3 = _interopRequireDefault(_shadowProperty2);

var _isSomething = require("./utils/isSomething");

var _isSomething2 = _interopRequireDefault(_isSomething);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var readonlyAutoShader = new _AutoShader2.default(true);
var readWriteAutoShader = new _AutoShader2.default(false);

/*
	Mappings for property names that always have the same type, such as create_on dates.
*/
var defaultShaders = {};

// Instnace variable names
var _automount = Symbol('_autoMount');
var _automountAll = Symbol('automountAll');
var _autoshadow = Symbol('autoShadow');
var _childShader = Symbol('childShader');
var _childShaderAutomount = Symbol('childShaderAutomount');
var _property = Symbol('property');
var _shaders = Symbol('shaders');

/*
	Combine with PropertyShader now that everything is a property.
*/

var Shader = function () {
	function Shader(property) {
		var autoShadow = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
		var automountAll = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

		_classCallCheck(this, Shader);

		this[_property] = property;
		this[_autoshadow] = autoShadow;
		this[_automountAll] = automountAll;

		// initialize instance variables
		this[_automount] = [];
		this[_childShader] = null;
		this[_shaders] = {};
	}

	_createClass(Shader, [{
		key: "add",
		value: function add(name, shader, automount) {
			this[_shaders][name] = shader;

			if (automount) {
				this[_automount].push(name);
			}

			return this;
		}
	}, {
		key: "addPropertyClass",
		value: function addPropertyClass(name, PropertyClass, defaults, autoShadow, readonly) {
			var property = this[_property];
			var shader = new _PropertyFactoryShader2.default(PropertyClass, property, defaults, autoShadow, readonly);

			this.add(name, shader);
		}
	}, {
		key: "addStateType",
		value: function addStateType(name, stateType) {
			var property = this[_property];
			var shader = stateType.factory(property);

			this.add(name, shader);
		}
	}, {
		key: "autoShader",
		value: function autoShader() {
			if (this[_autoshadow]) {
				return this[_property].readonly ? readonlyAutoShader : readWriteAutoShader;
			} else {
				return null;
			}
		}
	}, {
		key: "get",
		value: function get(name) {
			return this[_shaders][name];
		}
	}, {
		key: "isAutomount",
		value: function isAutomount(name) {
			if (this[_automountAll]) {
				return true;
			} else if (this[_shaders][name]) {
				return this[_automount][name] || this[_shaders][name].shouldAutomount();
			} else if (this[_childShader]) {
				return this[_childShaderAutomount] || this[_childShader].shouldAutomount();
			} else {
				return false;
			}
		}
	}, {
		key: "remove",
		value: function remove(name) {
			delete this[_shaders][name];

			// remove the automount setting
			var automountIdx = this[_automount].indexOf(name);

			if (automountIdx != -1) {
				this[_automount].splice(automountId, 1);
			}

			return this;
		}
	}, {
		key: "setAutomountAll",
		value: function setAutomountAll(automount) {
			this[_automountAll] = automount;
		}
	}, {
		key: "setAutoshadow",
		value: function setAutoshadow(value) {
			this[_autoshadow] = !!value;

			return this;
		}
	}, {
		key: "setElementClass",
		value: function setElementClass(PropertyClass, defaults, autoShadow, readonly) {
			var property = this[_property];
			var shader = new _PropertyFactoryShader2.default(PropertyClass, property, defaults, autoShadow, readonly);

			return this.setChildShader(shader);
		}
	}, {
		key: "setElementStateType",
		value: function setElementStateType(stateType) {
			var property = this[_property];
			var shader = stateType.factory(property);

			return this.setChildShader(shader);
		}
	}, {
		key: "setChildShader",
		value: function setChildShader(shader, automount) {
			if (this[_childShader]) {
				console.warn("Property already has a child shader set - ignoring setChildShader() call - shader=%O", this);
				return;
			}

			this[_childShader] = shader;
			this[_childShaderAutomount] = automount;

			return this;
		}

		/*
  	Gets the shader for a child property. This method returns the first shader generated by checking:
  		1) Property subclass optional shaderFor() method
  		2) shaders registered using add() or addPropertyClass() - named shaders
  		3) child shader (registered using setChildShader() )
  		4) default shaders (regustered using the static addDefault() method)
  		5) auto shader (applicable if autoShadow set to true)
  		Parameters:
  		name - the name of the child property
  		sate - the property's current state (not the child state)
  */

	}, {
		key: "shaderFor",
		value: function shaderFor(name, state) {
			if (this[_property].shaderFor) {
				var shader = this[_property].shaderFor(name, state);

				if (shader) {
					return shader;
				}
			}

			// priority order: named, child, default mapping, auto shading
			return this[_shaders][name] || this[_childShader] || defaultShaders[name] || this.autoShader();
		}

		/*
  	Creates the virtual shadow for a state property.
  */

	}, {
		key: "shadowProperty",
		value: function shadowProperty(time, name, parentState, parentImpl) {
			var property = this[_property];
			var isRoot = property.isRoot();

			(0, _invariant2.default)(parentState || isRoot, (0, _noParentStateErrorMsg2.default)(name, parentImpl));

			// get the initial state for the property
			var currState = isRoot ? parentState : parentState[name];
			var state = property.getInitialState(currState);

			if (!isRoot) {
				parentState[name] = state;
			}

			// add mixins to the property (but only once)
			if (!property.__hasMixins()) {
				var proto = Object.getPrototypeOf(property);
				var mixins = proto.constructor.mixins;
				var mixin = void 0;

				if (mixins) {
					for (var i = 0, len = mixins.length; i < len; i++) {
						mixin = mixins[i](property);

						property.__addMixin(mixin);
					}
				}
			}

			// create the backing implementation instance
			var ImplClass = property.implementationClass();
			var impl = (0, _shadowProperty3.default)(time, ImplClass, property, name, state, parentImpl, this);

			// set the current implementation
			property.setImpl(impl);

			return impl;
		}

		/*
  	Automounting is an experimental, partially implemented feature.
  */

	}, {
		key: "shouldAutomount",
		value: function shouldAutomount() {
			var proto = Object.getPrototypeOf(this[_property]);

			return proto.constructor.shouldAutomount && proto.constructor.shouldAutomount();
		}
	}, {
		key: "automountAll",
		get: function get() {
			return this[_automountAll];
		}
	}, {
		key: "autoShadow",
		get: function get() {
			return this[_autoshadow];
		}
	}, {
		key: "childShader",
		get: function get() {
			return this[_childShader];
		}
	}, {
		key: "property",
		get: function get() {
			return this[_property];
		}
	}], [{
		key: "addDefault",
		value: function addDefault(name, shader) {
			defaultShaders[name] = shader;
		}
	}]);

	return Shader;
}();

exports.default = Shader;