import invariant from "invariant";
import result from "lodash.result";

import Access from "./Access";
import Shader from "./Shader";
import Shadow from "./Shadow";
import ShadowImpl from "./ShadowImpl";

import isObject from "./utils/isObject";

const _autoShadow = Symbol('autoShadow');
const _impl = Symbol('impl');
const _initialState = Symbol('initialState');
const _mixins = Symbol('mixins');
const _parent = Symbol('parent');
const _readonly = Symbol('readonly');
const _shader = Symbol('shader');
const _shadowDescriptors = Symbol('shadowDescriptors');
const _store = Symbol('store');

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
export default class Property {
	constructor(initialState, autoShadow=true, readonly=false) {
		const { StateType } = require("./StateTypes");

		this[_autoShadow] = autoShadow;
		this[_initialState] = StateType.computeInitialState(this, initialState);
		this[_readonly] = readonly;
	}

	/*
		Gets the actual shadow property exposed to application code.
	*/
	get _() {
		const impl = this[_impl];

		return impl.isMapped() ?impl.shadow() :result(this.store.shadow, impl.dotPath());
	}

	/*
		Use this.$$ in shadow methods to get access to the property. Useful in Property subclass
		@shadow methods since the method will be bound to the shadow. Exposing on the property
		proper allows for the same code to work when called as a member function using 'this' or
		called through a shadow function.
	*/
	get $$() {
		return this;
	}

	/*
		Anything is possible (almost) with the ShadowImpl reference.
	*/
	get __() {
		return this[_impl];
	}

	get autoShadow() {
		return this[_autoShadow];
	}

	get initialState() {
		return this[_initialState];
	}

	get parent() {
		return this[_parent];
	}

	/*
		Gets the parent shadow property, a BaseProperty subclass.
	*/
	get parentState() {
		const parentImpl = this[_parent] && this[_parent][_impl];

		return parentImpl && parentImpl.shadow();
	}

	get path() {
		return this[_impl] ?this[_impl].path :null;
	}

	get slashPath() {
		return this[_impl] ?this[_impl].slashPath() :null;
	}

	get readonly() {
		return this[_readonly];
	}

	get root() {
		return this.store.root;
	}

	get rootState() {
		return this.store.root.state;
	}

	get state() {
		if (!stateDeprecatedWarningShown) {
			stateDeprecatedWarningShown = true;

			console.warn("Property.state property is deprecated - use Property._ instead");
		}

		return this._ ;
	}

	/*
		Gets the store containing the application state.
	*/
	get store() {
		if (!this[_store] && this.parent) {
			this[_store] = this.parent.store;
		}

		return this[_store];
	}

	isActive() {
		return this[_impl] && this[_impl].isActive();
	}

	isRoot() {
		return !this.parent;
	}

	/*

		Invoked by shadowProperty().
	*/
	onPropertyWillShadow() {
		if (this[_mixins]) {
			let mixins = this[_mixins];

			for (let i=0, mixin; mixin=mixins[i]; i++) {
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
	onPropertyDidShadow() {
		if (this[_mixins]) {
			let mixins = this[_mixins];

			for (let i=0, mixin; mixin=mixins[i]; i++) {
				if (mixin.propertyDidShadow) {
					mixin.propertyDidShadow();
				}
			}
		}

		this.propertyDidShadow();
	}

	onPropertyWillUpdate() {
		if (this[_mixins]) {
			let mixins = this[_mixins];

			for (let i=0, mixin; mixin=mixins[i]; i++) {
				if (mixin.propertyWillUpdate) {
					mixin.propertyWillUpdate();
				}
			}
		}

		this.propertyWillUpdate();
	}

	onPropertyDidUpdate() {
		if (this[_mixins]) {
			let mixins = this[_mixins];

			for (let i=0, mixin; mixin=mixins[i]; i++) {
				if (mixin.propertyDidUpdate) {
					mixin.propertyDidUpdate();
				}
			}
		}

		this.propertyDidUpdate();
	}

	onPropertyWillUnshadow() {
		if (this[_mixins]) {
			let mixins = this[_mixins];

			for (let i=0, mixin; mixin=mixins[i]; i++) {
				if (mixin.propertyWillUnshadow) {
					mixin.propertyWillUnshadow();
				}
			}
		}

		this.propertyWillUnshadow();
	}

	onPropertyDidUnshadow() {
		if (this[_mixins]) {
			let mixins = this[_mixins];

			for (let i=0, mixin; mixin=mixins[i]; i++) {
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
	refresh() {
		this[_impl] && this[_impl].update( state => ({ name: "refresh", nextState: state  }) );
	}

	/*
		Sets the auto shadow property flag.

		Parameters:
			auto - boolean where true means to auto map subproperties.

		Returns - reference to this property object.
	*/
	setAutoshadow(auto) {
		this[_autoShadow] = !!auto;

		return this;
	}

	/*
		Invoked everytime the property is shadowed to set the PropertyImpl instance backing this property.
	*/
	setImpl(impl) {
		const isActive = this.isActive();

		this[_impl] = impl;

// Functionality moved to store so didShadow() call occurs after store is setup with new state
//		isActive ?this.onPropertyDidUpdate() :this.onPropertyDidShadow();
	}

	/*
		Sets the default value returned by getInitialState().

		Returns - reference to this property object.
	*/
	setInitialState(state) {
		this[_initialState] = state;

		return this;
	}

	/*
		Sets this properties parent Property instance.

		Returns - reference to this property object.

		Throws
			Error - if parent already set.
	*/
	setParent(parent) {
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
	setReadonly(readonly) {
		this[_readonly] = readonly;
	}

	/*
		Sets the store containing the state represented by this property.

		Returns - reference to this property object.

		Throws
			Error - if store already set.
	*/
	setStore(store) {
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
	create$(impl) {
		return new Access(impl);
	}

	implementationClass() {
		return ShadowImpl;
	}

	/*
		Used by PropertyFactoryShader to set the shader used to create this property. External code should
		not need to utilize this method.
	*/
	setShader(shader) {
		invariant(!this[_shader], `Shader already set for property`);

		this[_shader] = shader;
	}

	shader(state) {
		if (!this[_shader]) {
			let proto = Object.getPrototypeOf(this);
			let stateSpec = proto.constructor.stateSpec;
			let { StateType } = require("./StateTypes");
			let shader;

			if (stateSpec instanceof StateType) {
				shader = stateSpec.shader(this);
			} else if (stateSpec) {
				shader = new StateType.shaderFromSpec(this, stateSpec);
			} else {
				shader = new Shader(this, this[_autoShadow]);
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
	shadow() { }

	/*
		Returns the Shadow subclass used to virtualize the state property.

		Returns - Shadow
	*/
	shadowClass() {
		return Shadow;
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
	getInitialState(state) {
		const { StateType } = require("./StateTypes");
		const initialState = state === undefined ?this[_initialState] :state;

		return StateType.initialStateWithDefaults(this, state);
	}

	propertyWillShadow() { /* subscribe to websockets */ }
	propertyDidShadow() { /* subscribe to websockets */ }
	propertyWillUpdate() { /* pre reshadow - chance to look at children states so do adapter type stuff */ }
	propertyDidUpdate() { /* post reshadow - might want to do something */ }
	propertyWillUnshadow() { /* unsubscribe to websockets */ }
	propertyDidUnshadow() { /* this is probably not needed */ }

	/*
		Invoked by ShadowImpl::invalidate() to notify that a child property or one of its descendents will
		be changing state. Useful hook when a property needs to perform some bookkeepng for child properties.
		Utilizing this hook provides a chance to make tracking changes in shadow properties before the
		store updates its state.
	*/
	onChildInvalidated(childProperty, sourceProperty) { }


	//------------------------------------------------------------------------------------------------------
	// mixin framework internal methods
	//------------------------------------------------------------------------------------------------------

	__addMixin(mixin) {
		// initialize only if needed to conserve space since likely not used often
		if (!this[_mixins]) {
			this[_mixins] = [];
		}

		this[_mixins].push(mixin);
	}

	__hasMixins() {
		return !!this[_mixins];
	}

	__mixins() {
		return this[_mixins];
	}
}



