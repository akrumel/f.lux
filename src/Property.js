import { assert } from "akutils";
import invariant from "invariant";
import result from "lodash.result";

import Access from "./Access";
import Shader from "./Shader";
import Shadow from "./Shadow";
import ShadowImpl from "./ShadowImpl";
import StateType from "./StateType";

const _autoShadow = Symbol('autoShadow');
const _checkpoint = Symbol('checkpoint');
const _impl = Symbol('impl');
const _initialState = Symbol('initialState');
const _mixins = Symbol('mixins');
const _parent = Symbol('parent');
const _pid = Symbol('pid');
const _readonly = Symbol('readonly');
const _shader = Symbol('shader');
const _shadowDescriptors = Symbol('shadowDescriptors');
const _stateType = Symbol('stateType');
const _store = Symbol('store');
const _ImplementationClass = Symbol('ImplementationClass');
const _ShadowClass = Symbol('ShadowClass');

var stateDeprecatedWarningShown = false;
var rootStateDeprecatedWarningShown = false;

var nextPid = 1;

function isPropertyPrototype(obj) {
	return Property === obj || Property.isPrototypeOf(obj);
}

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

		propertyChildInvalidated(childProperty, sourceProperty)
		propertyDidUpdate()

		onPropertyWillUnshadow()
			Invoked just before the shadow property is removed from the shadow state because the state
			property being shadowed has been removed from the application state.
	}

*/
export default class Property {
	constructor(stateType) {
		stateType = stateType || StateType.from(this);

		this[_pid] = nextPid++;
		this[_autoShadow] = stateType._autoShadow;
		this[_initialState] = stateType.computeInitialState();
		this[_readonly] = stateType._readonly;
		this[_stateType] = stateType
	}


	//------------------------------------------------------------------------------------------------------
	// Experimental checkpoint API
	//------------------------------------------------------------------------------------------------------

	checkpoint() {
		assert( a => a.not(this[_checkpoint], `Checkpoint already set: ${ this.dotPath() }`) );

		if (!this[_checkpoint]) {
			this[_checkpoint] = { data: this.state() };
		}
	}

	clearCheckpoint() {
		delete this[_checkpoint];
	}

	getCheckpoint() {
		return this[_checkpoint] && this[_checkpoint].data;
	}

	hasCheckpoint() {
		return !!this[_checkpoint];
	}

	resetToCheckpoint() {
		if (this[_impl] && this[_checkpoint]) {
			this[_impl].assign(this[_checkpoint].data);
		}

		this.clearCheckpoint();
	}

	/*
		Gets the actual shadow property exposed to application code.
	*/
	_() {
		const impl = this[_impl];

		if (!this[_store]) { return undefined }

		return this.isActive() && impl.isMapped() ?impl.shadow() :result(this[_store].shadow, impl.dotPath());
	}

	/*
		Anything is possible (almost) with the ShadowImpl reference.
	*/
	__() {
		return this[_impl];
	}

	/*
		Use this.$$() in shadow methods to get access to the property. Useful in Property subclass
		@shadow methods since the method will be bound to the shadow. Exposing on the property
		proper allows for the same code to work when called as a member function using 'this' or
		called through a shadow function.
	*/
	$$() {
		return this;
	}

	autoShadow() {
		return this[_autoShadow];
	}

	dotPath() {
		return this[_impl] ?this[_impl].dotPath() :null;
	}

	initialState() {
		return this[_stateType].computeInitialState();
	}

	isActive() {
		return this[_impl] && this[_impl].isActive();
	}

	isReadonly() {
		// use readonly flag if explicitly set otherwise use value from parent
		return this[_readonly] === undefined
			? this[_parent] && this[_parent].isReadonly()
			: this[_readonly];
	}

	isRoot() {
		return !this[_parent];
	}

	name() {
		return this[_impl] && this[_impl].name();
	}

	nextState() {
		return this[_impl] && this[_impl].nextState();
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

	onChildInvalidated(childProperty, sourceProperty) {
		if (this[_mixins]) {
			let mixins = this[_mixins];

			for (let i=0, mixin; mixin=mixins[i]; i++) {
				if (mixin.propertyChildInvalidated) {
					mixin.ChildInvalidated(childProperty, sourceProperty);
				}
			}
		}

		this.propertyChildInvalidated(childProperty, sourceProperty);
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

	parent() {
		return this[_parent];
	}

	path() {
		return this[_impl] ?this[_impl].path :null;
	}

	/*
		Gets the parent shadow property, a BaseProperty subclass.
	*/
	parentShadow() {
		const parentImpl = this[_parent] && this[_parent][_impl];

		return parentImpl && parentImpl.shadow();
	}

	pid() {
		return this[_pid];
	}

	root() {
		return this[_store].root;
	}

	rootShadow() {
		return this[_store]._;
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

	slashPath() {
		return this[_impl] ?this[_impl].slashPath() :null;
	}

	/*
		Gets the underlying property state.
	*/
	state() {
		return this[_impl] && this[_impl].state();
	}

	/*
		Gets the store containing the application state.
	*/
	store() {
		if (!this[_store] && this[_parent]) {
			this[_store] = this[_parent][_store];
		}

		return this[_store];
	}

	/*
		Triggers a reshadow of the properties shadow state. This is handy when a calculated state value changes
		while concrete state values remain unchanged.
	*/
	touch() {
		if (this.isActive()) {
			this.__().update( state => ( { name: "Property.touch()", nextState: state } ) );
		}
	}

	typeName() {
		return this.constructor.__fluxTypeName__ || this.constructor.name;
	}

	update(callback) {
		if (this.isActive()) {
			this.__().update(callback);
		} else {
			throw new Error("Property must be active to invoke update()");
		}
	}


	//------------------------------------------------------------------------------------------------------
	// Property subclasses may want to override these methods - no need to call super
	//------------------------------------------------------------------------------------------------------

	/*
		Creates the object to be assigned to the shadow.$ property.
	*/
	create$(impl) {
		return new Access(impl);
	}

	implementationClass() {
		return StateType.implementationClassForProperty(this, this[_ImplementationClass]);
	}

	setImplementationClass(PropertyClass) {
		this[_ImplementationClass] = PropertyClass
	}

	/*
		Used by PropertyFactoryShader to set the shader used to create this property. External code should
		not need to utilize this method.
	*/
	setShader(shader) {
		invariant(!this[_shader], `Shader already set for property`);

		this[_shader] = shader;
	}

	setShadowClass(ShadowClass) {
		this[_ShadowClass] = ShadowClass
	}

	shader(state) {
		if (!this[_shader]) {
			this[_shader] = this[_stateType].shader(this);
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

		Returns - Shadow class
	*/
	shadowClass() {
		return this[_stateType].shadowClassForProperty(this[_ShadowClass]);
	}

	/*
		Gets the StateType used for creating this property.
	*/
	stateType() {
		return this[_stateType];
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
		const initialState = state === undefined ?this[_initialState] :state;

		return this[_stateType].initialStateWithDefaults(initialState);
	}

	propertyWillShadow() { /* subscribe to websockets */ }
	propertyDidShadow() { /* subscribe to websockets */ }

	/*
		A child property or one of its descendents wil be changing state. Useful hook when a property needs
		to perform some bookkeepng for child properties. Utilizing this hook provides a chance to make tracking
		changes in shadow properties before the store updates its state.
	*/
	propertyChildInvalidated(childProperty, sourceProperty) { }

	propertyDidUpdate() { /* post reshadow */ }
	propertyWillUnshadow() { /* unsubscribe to websockets */ }
	propertyDidUnshadow() { /* this is probably not needed */ }



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



