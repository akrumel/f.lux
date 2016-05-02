"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _lodash = require("lodash.result");

var _lodash2 = _interopRequireDefault(_lodash);

var _Access = require("./Access");

var _Access2 = _interopRequireDefault(_Access);

var _Shader = require("./Shader");

var _Shader2 = _interopRequireDefault(_Shader);

var _Shadow = require("./Shadow");

var _Shadow2 = _interopRequireDefault(_Shadow);

var _ShadowImpl = require("./ShadowImpl");

var _ShadowImpl2 = _interopRequireDefault(_ShadowImpl);

var _isObject = require("./utils/isObject");

var _isObject2 = _interopRequireDefault(_isObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _autoShadow = Symbol('autoShadow');
var _impl = Symbol('impl');
var _initialState = Symbol('initialState');
var _mixins = Symbol('mixins');
var _parent = Symbol('parent');
var _readonly = Symbol('readonly');
var _shader = Symbol('shader');
var _shadowDescriptors = Symbol('shadowDescriptors');
var _store = Symbol('store');

var stateDeprecatedWarningShown = false;

/*
	Base class for custom f.lux properties. A Property has a lifetime from when the state property
	is mapped until it is replaced/deleted. This differs from ShadowImpl/Shadow pairs as their
	lifetime lasts from the time of mapping until the state property is replaced/deleted OR the
	shadow property is invalidated due to a local change or a descendant property change.

	A Property instance is managed by the current PropertyImpl shadowing a state property.

	Life cycle methods:
		propertyWillShadow()
			Invoked just before a state property is going to be shadowed using this instance. The 'state'
			variable will be undefined.
		propertyDidShadow()

		propertyWillUpdate()

		propertyDidUpdate()

		propertyWillUnmount()
			Invoked just before the shadow property is removed from the shadow state because the state
			property being shadowed has been removed from the application state.

	Developers of property components will often override one or more of the following methods:
		getInitialState()
			Get the initial state to populate for this property.
		getPropertySpec()
			Defines the sub properties structure used for creating state shadow.
		shadow()
			Generates the shadow property specialization. This will usually consist of methods to be
			exposed on the shadow property to the app code. The methods and properties of the
			returned object are mixed in with the state properties. Methods exposed in this way
			define the API for the state properties and the implementations will often call
			helper methods in your Property subclass.

	Subclasses must implement the following methods
		getInitialState()
			Get the initial state to populate for this property.
		getPropertySpec()
			Defines the sub properties structure used for creating state shadow.
		implementationClass()
			The PropertyImpl subclass that matches support for this class
		shaderFor(name, state)
			Optional method. If present, called before checking getShaderSpec() to allow dynamic shader
			creation based on state. (Feature not yet implemented)
		shadow()
			Generates the shadow property specialization. This will usually consist of methods to be
			exposed on the shadow property to the app code.
		shadowClass()
			Returns the Shadow subclass to instantiate for the shadow. Called by
			extendProperty() which in turn is called by ShadowImpl::shadow()
	}

*/

var Property = function () {
	function Property(initialState) {
		var autoShadow = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
		var readonly = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

		_classCallCheck(this, Property);

		this[_autoShadow] = autoShadow;
		this[_initialState] = initialState;
		this[_readonly] = readonly;

		// Use this.$$ in @shadow methods to get access to the property since the method will
		// be bound to the shadow.
		Object.defineProperty(this, '$$', { enumerable: true, value: this });
	}

	/*
 	Gets the actual shadow property exposed to application code.
 */


	_createClass(Property, [{
		key: "isActive",
		value: function isActive() {
			return this[_impl] && this[_impl].isActive();
		}
	}, {
		key: "isRoot",
		value: function isRoot() {
			return !this.parent;
		}

		/*
  		Invoked by shadowProperty().
  */

	}, {
		key: "onPropertyWillShadow",
		value: function onPropertyWillShadow() {
			if (this[_mixins]) {
				var mixins = this[_mixins];

				for (var i = 0, mixin; mixin = mixins[i]; i++) {
					if (mixin.propertyWillShadow) {
						mixin.propertyWillShadow();
					}
				}
			}

			this.propertyWillShadow();
		}

		/*
  		Invoked by shadowProperty().
  */

	}, {
		key: "onPropertyDidShadow",
		value: function onPropertyDidShadow() {
			if (this[_mixins]) {
				var mixins = this[_mixins];

				for (var i = 0, mixin; mixin = mixins[i]; i++) {
					if (mixin.propertyDidShadow) {
						mixin.propertyDidShadow();
					}
				}
			}

			this.propertyDidShadow();
		}
	}, {
		key: "onPropertyWillUpdate",
		value: function onPropertyWillUpdate() {
			if (this[_mixins]) {
				var mixins = this[_mixins];

				for (var i = 0, mixin; mixin = mixins[i]; i++) {
					if (mixin.propertyWillUpdate) {
						mixin.propertyWillUpdate();
					}
				}
			}

			this.propertyWillUpdate();
		}
	}, {
		key: "onPropertyDidUpdate",
		value: function onPropertyDidUpdate() {
			if (this[_mixins]) {
				var mixins = this[_mixins];

				for (var i = 0, mixin; mixin = mixins[i]; i++) {
					if (mixin.propertyDidUpdate) {
						mixin.propertyDidUpdate();
					}
				}
			}

			this.propertyDidUpdate();
		}
	}, {
		key: "onPropertyWillUnshadow",
		value: function onPropertyWillUnshadow() {
			if (this[_mixins]) {
				var mixins = this[_mixins];

				for (var i = 0, mixin; mixin = mixins[i]; i++) {
					if (mixin.propertyWillUnshadow) {
						mixin.propertyWillUnshadow();
					}
				}
			}

			this.propertyWillUnshadow();
		}
	}, {
		key: "onPropertyDidUnshadow",
		value: function onPropertyDidUnshadow() {
			if (this[_mixins]) {
				var mixins = this[_mixins];

				for (var i = 0, mixin; mixin = mixins[i]; i++) {
					if (mixin.propertyDidUnshadow) {
						mixin.propertyDidUnshadow();
					}
				}
			}

			this.propertyDidUnshadow();
		}

		/*
  	Invalidates the component so that its shadow will be regenerated. This is handy to trigger when
  	the shadow() output is altered. Changes to the shadow state will automatically trigger a refresh.
  */

	}, {
		key: "refresh",
		value: function refresh() {
			this[_impl] && this[_impl].update(function (state) {
				return { name: "refresh", nextState: state };
			});
		}

		/*
  	Sets the auto shadow property flag.
  		Parameters:
  		auto - boolean where true means to auto map subproperties.
  		Returns - reference to this property object.
  */

	}, {
		key: "setAutoshadow",
		value: function setAutoshadow(auto) {
			this[_autoShadow] = !!auto;

			return this;
		}

		/*
  	Invoked everytime the property is shadowed to set the PropertyImpl instance backing this property.
  */

	}, {
		key: "setImpl",
		value: function setImpl(impl) {
			var isActive = this.isActive();

			this[_impl] = impl;

			// Functionality moved to store so didShadow() call occurs after store is setup with new state
			//		isActive ?this.onPropertyDidUpdate() :this.onPropertyDidShadow();
		}

		/*
  	Sets the default value returned by getInitialState().
  		Returns - reference to this property object.
  */

	}, {
		key: "setInitialState",
		value: function setInitialState(state) {
			this[_initialState] = state;

			return this;
		}

		/*
  	Sets this properties parent Property instance.
  		Returns - reference to this property object.
  		Throws
  		Error - if parent already set.
  */

	}, {
		key: "setParent",
		value: function setParent(parent) {
			if (this[_parent]) {
				throw new Error("Parent already set");
			}

			this[_parent] = parent;

			return this;
		}

		/*
  	Sets the readonly flag which will prevent a 'set' function being set in the implementation's
  	defineProeprty().
  */

	}, {
		key: "setReadonly",
		value: function setReadonly(readonly) {
			this[_readonly] = readonly;
		}

		/*
  	Sets the store containing the state represented by this property.
  		Returns - reference to this property object.
  		Throws
  		Error - if store already set.
  */

	}, {
		key: "setStore",
		value: function setStore(store) {
			if (this[_store]) {
				throw new Error("Store already set on property");
			}

			this[_store] = store;

			return this;
		}

		//------------------------------------------------------------------------------------------------------
		// Property subclasses may want to override thise methods
		//------------------------------------------------------------------------------------------------------

		/*
  	Creates the object to be assigned to the shadow.$ property.
  */

	}, {
		key: "create$",
		value: function create$(impl) {
			return new _Access2.default(impl);
		}
	}, {
		key: "implementationClass",
		value: function implementationClass() {
			return _ShadowImpl2.default;
		}

		/*
  	Used by PropertyFactoryShader to set the shader used to create this property. External code should
  	not need to utilize this method.
  */

	}, {
		key: "_setShader",
		value: function _setShader(shader) {
			(0, _invariant2.default)(!this[_shader], "Shader already set for property");

			this[_shader] = shader;
		}
	}, {
		key: "shader",
		value: function shader(state) {
			if (!this[_shader]) {
				var proto = Object.getPrototypeOf(this);
				var stateSpec = proto.constructor.stateSpec;

				var _require = require("./StateTypes");

				var StateType = _require.StateType;

				var shader = void 0;

				if (stateSpec instanceof StateType) {
					shader = stateSpec.shader(this);
				} else if (stateSpec) {
					debugger;
					// ADD Shader.fromSpec()
					shader = new StateType.shaderFromSpec(this, stateSpec);
				} else {
					shader = new _Shader2.default(this, this[_autoShadow]);
				}

				this[_shader] = shader;
			}

			return this[_shader];
		}

		/*
  	Generates the functional mixin to map onto the state property shadow. This method must be
  	overriden.
  		Returns - this implementation returns nothing.
  */

	}, {
		key: "shadow",
		value: function shadow() {}

		/*
  	Returns the Shadow subclass used to virtualize the state property.
  		Returns - Shadow
  */

	}, {
		key: "shadowClass",
		value: function shadowClass() {
			return _Shadow2.default;
		}

		//------------------------------------------------------------------------------------------------------
		// State lifecycle methods
		//------------------------------------------------------------------------------------------------------

		/*
  	Gets the initial state for a property at the beginning of the property mounting process. This
  	implementation merges the 'initialState' parameter passed to the constructor or set using the
  	initialState() method with the state passed in from the existing store state. The store's state
  	property values take precedence.
  		Parameters:
  		state - the store's property state at the time of mounting.
  		Returns - merged state with the state parameter taking precedence if the initial state is set
  		otherwise returns the state parameter. This base implementation simply returns the state
  		parameter
  */

	}, {
		key: "getInitialState",
		value: function getInitialState(state) {
			return state === undefined ? this[_initialState] : state;
		}
	}, {
		key: "propertyWillShadow",
		value: function propertyWillShadow() {/* subscribe to websockets */}
	}, {
		key: "propertyDidShadow",
		value: function propertyDidShadow() {/* subscribe to websockets */}
	}, {
		key: "propertyWillUpdate",
		value: function propertyWillUpdate() {/* pre reshadow - chance to look at children states so do adapter type stuff */}
	}, {
		key: "propertyDidUpdate",
		value: function propertyDidUpdate() {/* post reshadow - might want to do something */}
	}, {
		key: "propertyWillUnshadow",
		value: function propertyWillUnshadow() {/* unsubscribe to websockets */}
	}, {
		key: "propertyDidUnshadow",
		value: function propertyDidUnshadow() {} /* this is probably not needed */

		/*
  	Invoked by ShadowImpl::invalidate() to notify that a child property or one of its descendents will
  	be changing state. Useful hook when a property needs to perform some bookkeepng for child properties.
  	Utilizing this hook provides a chance to make tracking changes in shadow properties before the
  	store updates its state.
  */

	}, {
		key: "onChildInvalidated",
		value: function onChildInvalidated(childProperty, sourceProperty) {}

		//------------------------------------------------------------------------------------------------------
		// mixin framework internal methods
		//------------------------------------------------------------------------------------------------------

	}, {
		key: "__addMixin",
		value: function __addMixin(mixin) {
			// initialize only if needed to conserve space since likely not used often
			if (!this[_mixins]) {
				this[_mixins] = [];
			}

			this[_mixins].push(mixin);
		}
	}, {
		key: "__hasMixins",
		value: function __hasMixins() {
			return !!this[_mixins];
		}
	}, {
		key: "__mixins",
		value: function __mixins() {
			return this[_mixins];
		}
	}, {
		key: "_",
		get: function get() {
			var impl = this[_impl];

			return impl.isMapped() ? impl.shadow() : (0, _lodash2.default)(this.store.shadow, impl.dotPath());
		}

		/*
  	Anything is possible (almost) with the PropertyImpl reference.
  */

	}, {
		key: "__",
		get: function get() {
			return this[_impl];
		}
	}, {
		key: "autoShadow",
		get: function get() {
			return this[_autoShadow];
		}
	}, {
		key: "initialState",
		get: function get() {
			return this[_initialState];
		}
	}, {
		key: "parent",
		get: function get() {
			return this[_parent];
		}

		/*
  	Gets the parent shadow property, a BaseProperty subclass.
  */

	}, {
		key: "parentState",
		get: function get() {
			var parentImpl = this[_parent] && this[_parent][_impl];

			return parentImpl && parentImpl.shadow();
		}
	}, {
		key: "path",
		get: function get() {
			return this[_impl] ? this[_impl].path : null;
		}
	}, {
		key: "slashPath",
		get: function get() {
			return this[_impl] ? this[_impl].slashPath() : null;
		}
	}, {
		key: "readonly",
		get: function get() {
			return this[_readonly];
		}
	}, {
		key: "root",
		get: function get() {
			return this.store.root;
		}
	}, {
		key: "rootState",
		get: function get() {
			return this.store.root.state;
		}
	}, {
		key: "state",
		get: function get() {
			if (!stateDeprecatedWarningShown) {
				stateDeprecatedWarningShown = true;

				console.warn("Property.state property is deprecated - use Property._ instead");
			}

			debugger;
			return this._;
		}

		/*
  	Gets the store containing the application state.
  */

	}, {
		key: "store",
		get: function get() {
			if (!this[_store] && this.parent) {
				this[_store] = this.parent.store;
			}

			return this[_store];
		}
	}]);

	return Property;
}();

exports.default = Property;