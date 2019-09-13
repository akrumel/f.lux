import { assert } from "akutils";
import Symbol from "es6-symbol";
import invariant from "invariant";
import result from "lodash.result";

import Access from "./Access";
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


/**
	Base class for custom f.lux properties. A `Property` has a lifespan from when the state property
	is mapped until it is replaced/deleted. This differs from {@link Shadow} as its lifespan
	that lasts from the time of mapping until the state property is replaced/deleted OR the
	shadow property is invalidated due to a local change or a descendant property change.

	Most shadow state properties can be implemented without writing a `Property` subclass, relying on
	autoshadowing, or defining the state structure using {@link StateType} along with one of the
	built-in property class `createClass()` static methods. The primary reason for writing a
	`Property` subclass is to tie into the f.lux property life-cycle.

	This class provides an experimental check pointing api. Check pointing allows the state to
	be recorded at a point in time and then later reset to that point. This is handy when a form
	may accept changes and then allow the user to cancel the edit session.

	Life cycle methods:
	<ul>
		<li>`propertyWillShadow()` - invoked just before a state property is going to be shadowed using
			this instance. Shadow state is not valid during this method.</li>
		<li>`propertyDidShadow()` - property was shadowed and fully functional.</li>
		<li>`propertyChildInvalidated(childProperty, sourceProperty)` - a child property mutation action
			has occurred and it's value will change in store's next update.</li>
		<li>`propertyDidUpdate()` - state managed by this property has changed.</li>
		<li>`propertyWillUnshadow()` - invoked just before the shadow property is removed from the shadow
			state because the state property being shadowed has been removed from the application state.</li>
	</ul>

	@see {@link ArrayProperty}
	@see {@link CollectionProperty}
	@see {@link IndexedProperty}
	@see {@link MapProperty}
	@see {@link ObjectProperty}
*/
export default class Property {
	/**
		If a {@link StateType} is not passed to this constructor then one is located using
		{@link StateType.from} thus ensuring the f.lux shadowing process is defined for this
		property.

		@param {StateType} [stateType] - a specialized {@link StateType} instance describing how f.lux should
			shadow this property.
	*/
	constructor(stateType) {
		stateType = stateType || StateType.from(this);

		assert( a => a.is(stateType, "No 'type' static property found in class hieararchy") );

		this[_stateType] = stateType;
	}


	//------------------------------------------------------------------------------------------------------
	// Experimental checkpoint API
	//------------------------------------------------------------------------------------------------------

	/**
		Copies the current actual state for later reset using {@link Property#resetToCheckpoint}. An existing
		checkpoint will take precedence over subsequent calls.
	*/
	checkpoint() {
		assert( a => a.not(this[_checkpoint], `Checkpoint already set: ${ this.dotPath() }`) );

		if (!this[_checkpoint]) {
			this[_checkpoint] = { data: this.state() };
		}
	}

	/**
		Clears an existing checkpoint created using {@link Property#checkpoint}.
	*/
	clearCheckpoint() {
		delete this[_checkpoint];
	}

	/**
		Gets the checkpoint state previously recorded using {@link Property#checkpoint}.

		@return the checkpoint data if checkpoint is set.
	*/
	getCheckpoint() {
		return this[_checkpoint] && this[_checkpoint].data;
	}

	/**
		Gets if an existing checkpoint has be created using {@link Property#checkpoint}.

		@return {boolean} true if a checkpoint has been recorded.
	*/
	hasCheckpoint() {
		return !!this[_checkpoint];
	}

	/**
		Replaces the current property state with a checkpoint state previously recorded using
		{@link Property#checkpoint}. The checkpoint is cleared.
	*/
	resetToCheckpoint() {
		if (this[_impl] && this[_checkpoint]) {
			this[_impl].assign(this[_checkpoint].data);
		}

		this.clearCheckpoint();
	}

	//------------------------------------------------------------------------------------------------------
	// Experimental validation API
	//------------------------------------------------------------------------------------------------------

	/**
		Clears validation errors from the model.
	*/
	clearValidationErrors() {
		if (this._validationErrors) {
			delete this._validationErrors;
			this.touch();
		}
	}

	hasValidationErrors() {
		return this._validationErrors && this._validationErrors.length;
	}

	/**
		Experimental feature for validation errors. Errors is an array with each element having the form:
		<ul>
			<li>message: error description</li>
			<li>path: path to property causing error</li>
			<li>type: library specific reason for error</li>
		</ul>
	*/
	setValidationErrors(errors) {
		if (errors) {
			if (!Array.isArray(errors)) {
				return console.warn("Validation errors must be an array", errors);
			} else if (!errors.length) {
				return this.clearValidationErrors();
			}

			const changed = !(this._validationErrors &&
				errors.length === this._validationErrors.length &&
				this._validationErrors.every( e => errors.some( er => er.path === e.path )));

			if (changed) {
				this._validationErrors = errors;
				this.touch();
			}
		} else {
			this.clearValidationErrors();
		}

	}

	/**
		Gets the validation errors or an empty array if non are set.
	*/
	validationErrors() {
		return this._validationErrors ?Object.assign(this._validationErrors) :[];
	}

	/**
		Gets the actual shadow property exposed to application code.

		@return {Shadow} shadow state for this property if active.
	*/
	_() {
		const impl = this[_impl];

		if (!this[_store]) { return undefined }

		return this.isActive() && impl.isMapped() ?impl.shadow() :result(this[_store].shadow, impl.dotPath());
	}

	/**
		Anything is possible (almost) with the ShadowImpl reference.

		@return {ShadowImpl} the implementation instance backing the current {@link Shadow}.
	*/
	__() {
		return this[_impl];
	}

	/**
		Gets the {@link Access} object for obtaining information about a property.

		@return {Access}
	*/
	$() {
		return this[_impl].access();
	}

	/**
		Use this.$$() in shadow methods to get access to the property. Useful in `Property` subclass
		`@shadow` methods since the method will be bound to the shadow. Exposing on the `Property`
		allows for the same code to work when called as a member function using `this` or
		called through a shadow function.

		@return {Property} the property instance (`this`)
	*/
	$$() {
		return this;
	}

	/**
		Gets if autoshadowing is enabled for this property. Unlike the {@link Property#readonly} shadowing
		attribute, autoshadowing is not hierarchically determined.

		@return {boolean} true if autoshadowing is enabled
	*/
	autoShadow() {
		return this[_autoShadow] || this[_stateType]._autoShadow;
	}

	/**
		Gets the path from root property using a dot (`.`) separator. Suitable for using with the lodash `result()`
		function.

		@return {string} path with each component joined by a `.`

		@see https://lodash.com/docs/4.17.4#result
	*/
	dotPath() {
		return this[_impl] ?this[_impl].dotPath() :null;
	}

	/**
		Gets the initial state for a property at the beginning of the property mounting process. This
		implementation merges the {@link StateType#initialStateWithDefaults}, the initial state set using
		{@link #setInitialState}, and the state passed in from the existing store state. The store's state property
		values take precedence. The explicitly set initial state is used only when the `state` parameter is
		`undefined`.

		@param state - the store's property state at the time of mounting.

		@return merged state with the state parameter taking precedence if the initial state is set
			otherwise returns the state parameter. This base implementation simply returns the state
			parameter
	*/
	getInitialState(state) {
		const initialState = state !== undefined
			? state
			: this[_initialState] !== undefined ?this[_initialState] :this[_stateType].computeInitialState();

		return this[_stateType].initialStateWithDefaults(initialState);
	}

	/**
		Gets the {@link ShadowImpl} subclass used for implementing the {@link Shadow} f.lux integration.

		@ignore
	*/
	implementationClass() {
		return StateType.implementationClassForProperty(this, this[_ImplementationClass]);
	}

	/**
		Gets the result from {@link StateType#computeInitialState}.
	*/
	initialState() {
		return this[_stateType].computeInitialState();
	}

	/**
		Gets if the property is currently shadowing an actual state property.

		@return {boolean}
	*/
	isActive() {
		return this[_impl] && this[_impl].isActive();
	}

	/**
		Gets if property is an actual isolated property managed by the store. This implementation always
		returns false. Override to change behavior.

		@return {boolean}
	*/
	isIsolated() {
		return false;
	}

	/**
		Gets if the property allows for assignment through the shadow state, ie `todo.desc = "go skiing"`. The
		readonly attribute is hierarchically determined through the parent property if not explicitly set.

		@return {boolean} - true if assignment is not allowed
	*/
	isReadonly() {
		const readonly = this[_readonly] !== undefined ?this[_readonly] :this[_stateType]._readonly;

		// use readonly flag if explicitly set otherwise use value from parent
		return readonly === undefined
			? this[_parent] && this[_parent].isReadonly()
			: readonly;
	}

	/**
		Gets if this is the shadow state root property.

		@return {boolean} true if this is the root property of the {@link Store} managing the application state.
	*/
	isRoot() {
		return !this[_parent];
	}

	/**
		The property name by which this property is referenced by the {@link Property.parent}.

		@return {string|number} the name or `undefined` if not active. A `string` for an object child
			property and a `nuber` for an array element.
	*/
	name() {
		return this[_impl] && this[_impl].name();
	}

	/**
		Gets what the actual state for this property will be after the {@link Store} updates all pending
		actions.

		@return the next state or `undefined` if not active.
	*/
	nextState() {
		return this[_impl] && this[_impl].nextState();
	}

	/** @ignore */
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

	/** @ignore */
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

	/** @ignore */
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

	/** @ignore */
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

	/** @ignore */
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

	/**
		Gets the parent property.

		@return {Property} the parent property or `undefined` if this is the shadow state root.
	*/
	parent() {
		return this[_parent];
	}

	/**
		Gets the {@link Property#name} components from the root property to this property.

		@return {[]} array where each name component is either a `string` or `number` depending on the
			each parent component's type.
	*/
	path() {
		return this[_impl] ?this[_impl].path() :null;
	}

	/**
		Gets the parent's shadow property.

		@return {Shadow}
	*/
	parentShadow() {
		const parentImpl = this[_parent] && this[_parent][_impl];

		return parentImpl && parentImpl.shadow();
	}

	/**
		Gets the unique f.lux ID for this property.

		@return {number} the id
	*/
	pid() {
		if (!this[_pid]) {
			this[_pid] = nextPid++;
		}

		return this[_pid];
	}

	/** @ignore */
	readonlyExplicit() {
		return this[_readonly];
	}

	/**
		Gets the shadow state root property for the {@link Store} managing this property.

		@return {Property} the root property
	*/
	root() {
		return this[_store].root;
	}

	/**
		Gets the root shadow state for the {@link Store} managing this property.

		@return {Shadow}
	*/
	rootShadow() {
		return this[_store]._;
	}

	/**
		Sets the auto shadow property flag.

		Note: this method is rarely required as the {@link StateType} will usually configure this attribute.

		@param {boolean} auto - boolean where true means to auto map subproperties.

		@returns - reference to this property object.
	*/
	setAutoshadow(auto) {
		this[_autoShadow] = !!auto;

		return this;
	}

	/**
		Invoked everytime the property is shadowed to set the PropertyImpl instance backing this property.

		@ignore
	*/
	setImpl(impl) {
		const isActive = this.isActive();

		this[_impl] = impl;
	}

	/**

	*/
	setImplementationClass(ImplClass) {
		assert( a => {
			const isImplClass = ImplClass === ShadowImpl || ShadowImpl.isPrototypeOf(ImplClass);

			a.is(isImplClass, "ImplClass must be a ShadowImpl subclass") ;
		});

		this[_ImplementationClass] = ImplClass
	}

	/**
		Explicitly sets an initial state that will be used if the state tree does not have a value for this
		property. This value is used by {@link Property#getInitialState} and is merged using
		{@link StateType#initialStateWithDefaults}.

		Note: this method is rarely required as the {@link StateType} will usually configure this attribute.

		@param state - the initial state for the property

		@return {Property} - reference to this property object.
	*/
	setInitialState(state) {
		this[_initialState] = state;

		return this;
	}

	/**
		Sets this property's parent {@link Property} instance.

		@return {Property} reference to this property object.
		@throws {Error} parent already set.

		@ignore
	*/
	setParent(parent) {
		if (this[_parent]) {
			throw new Error("Parent already set");
		}

		this[_parent] = parent;

		return this;
	}

	/**
		Sets the readonly flag which will prevent an assignment from changing the value. More technically, a 'set'
		function being set in the implementation's defineProeprty().

		Note: this method is rarely required as the {@link StateType} will usually configure this attribute.
	*/
	setReadonly(readonly) {
		this[_readonly] = readonly;
	}

	/**
		Used by PropertyFactoryShader to set the shader used to create this property. External code should
		not need to utilize this method.

		@ignore
	*/
	setShader(shader) {
		assert( a => a.not(this[_shader], "Shader already set for property") );

		this[_shader] = shader;
	}

	/**
		Sets the class to be used for the shadow api

		@param {Shadow} ShadowClass - the {@link Shadow} class or one of its subclasses
	*/
	setShadowClass(ShadowClass) {
		assert( a => {
			const isShadowClass = ShadowClass === Shadow || Shadow.isPrototypeOf(ShadowClass);

			a.is(isShadowClass, "ShadowClass must be a Shadow subclass") ;
		});

		this[_ShadowClass] = ShadowClass
	}

	/**
		Sets the store containing the state represented by this property.

		@return {Property} - reference to this property object.
		@throws {Error} - store already set.

		@ignore
	*/
	setStore(store) {
		if (this[_store]) {
			throw new Error("Store already set on property");
		}

		this[_store] = store;

		return this;
	}

	/**
		Gets the {@link Shader} instance for this property.
	*/
	shader(state) {
		if (!this[_shader]) {
			this[_shader] = this[_stateType].shader(this);
		}

		return this[_shader];
	}

	/**
		Returns the Shadow subclass used to virtualize the state property.

		Returns - Shadow class
	*/
	shadowClass() {
		return this[_stateType].shadowClassForProperty(this[_ShadowClass]);
	}

	/**
		Gets the path from root property using a slash (`/`) separator.

		@return {string} path with each component separated by a `/`
	*/
	slashPath() {
		return this[_impl] ?this[_impl].slashPath() :null;
	}

	/**
		Gets the actual state being shadowed.
	*/
	state() {
		return this[_impl] && this[_impl].state();
	}

	/**
		Gets the StateType used for creating this property.
	*/
	stateType() {
		return this[_stateType];
	}

	/**
		Gets the {@Link Store} containing the application state.
	*/
	store() {
		if (!this[_store] && this[_parent]) {
			this[_store] = this[_parent].store();
		}

		return this[_store];
	}

	/**
		Triggers a reshadow of the properties shadow state. This is handy when a calculated state value changes
		while concrete state values remain unchanged.
	*/
	touch(reason="Property.touch()") {
		if (this.isActive()) {
			this[_impl].update( state => ( { name: reason, nextState: state } ) );
		}
	}

	/**
		Gets this property's {@link StateType.typeName} value.
	*/
	typeName() {
		return this.constructor.__fluxTypeName__ || this.constructor.name;
	}

	/**
		Makes changes to the next proeprty state. The callback should be pure (no side affects).

		The callback has the form:

		```js
		function callback(state) : { name, nextState, replace }
		```
		where:

		<ul>
		<li>`state` - the current state</li>
		<li>`nextState` - the next state for the property</li>
		<li>`name` - the name of the action, such as "assign()" (optional)</li>
		<li>`replace` - should the entire state for this property be replaced with `nextState`. A value of
			`true` means this property will unshadow and all of it's children will not be able to make
			future changes to the model. (optional - default=false)</li>
		</ul>

		The callback return value is called an *action descriptor* and describes the update behavior.To
		understand the reasoning behind the replace flag consider the following example:

		```
		const model = { a: { b: { c: 1 } } }
		const oldB = model.a.b

		model.a.b = "foo"
		oldB.c = 5

		model.a.b.c === undefined
		```js

		Thus, oldB.c may change oldB'c property 'c' to 5 but model.a.b is still "foo".

		@param {function} callback - takes the current state and returns an object containing
			the *action descriptor* (see discussion above). At a minimum, the action descriptor must contain
			a `nextState` property containing the property's state following the action.
	*/
	update(callback) {
		if (this.isActive()) {
			this[_impl].update(callback);
		} else {
			throw new Error("Property must be active to invoke update()");
		}
	}


	//------------------------------------------------------------------------------------------------------
	// Property subclasses may want to override these methods - no need to call super
	//------------------------------------------------------------------------------------------------------

	/**
		Creates the object to be assigned to the shadow.$ property. Subclasses can override this method
		to setup a chain of specialized accessors (`$()`). See {@link Access} for details on setting up
		specialized accessors. This is an advanced feature and rarely required.

		@return {Access} a property accessor instance.
	*/
	create$(impl) {
		return new Access(impl);
	}

	/**
		Gets the object containing or managing this property. All properties have an owner except
		the root property. Isolated properties are a case where a property is independently managed
		by the store so it can have an owner but not a parent.

		@return {Property} alias for {@link Property#parent}
	*/
	owner() {
		return this.parent();
	}

	//------------------------------------------------------------------------------------------------------
	// State lifecycle methods
	//------------------------------------------------------------------------------------------------------

	/**
		Invoked by the f.lux shadowing process just before a property initially shadows a state property.
		The property is not active when this method is invoked so state values cannot be accessed. This
		method is useful for constructor type activities when you do not want to implement a constructor.

		Subclasses do not need to invoke the parent implementation.
	*/
	propertyWillShadow() { /* subscribe to websockets */ }

	/**
		Invoked by the f.lux shadowing process after a property initially shadows a state property. The
		property is active and can safely access the shadow state.

		Subclasses do not need to invoke the parent implementation.
	*/
	propertyDidShadow() { /* subscribe to websockets */ }

	/**
		A child property or one of its descendents wil be changing state. Useful hook when a property needs
		to perform some bookkeepng for child properties. Utilizing this hook provides a chance to make tracking
		changes in shadow properties before the store updates its state.

		Subclasses do not need to invoke the parent implementation.

		@param {Property} childProperty - the immediate child property through which the update is occurring.
		@param {Property} sourceProperty - the property generating the property change.
	*/
	propertyChildInvalidated(childProperty, sourceProperty) { }

	/**
		Invoked by the f.lux shadowing process after a property is reshadowed.

		Subclasses do not need to invoke the parent implementation.
	*/
	propertyDidUpdate() { /* post reshadow */ }

	/**
		Invoked by the f.lux shadowing process just before a property will be removed from the shadow state.

		Subclasses do not need to invoke the parent implementation.
	*/
	propertyWillUnshadow() { /* unsubscribe to websockets */ }



	//------------------------------------------------------------------------------------------------------
	// mixin framework internal methods
	//------------------------------------------------------------------------------------------------------

	/** @ignore */
	__addMixin(mixin) {
		// initialize only if needed to conserve space since likely not used often
		if (!this[_mixins]) {
			this[_mixins] = [];
		}

		this[_mixins].push(mixin);
	}

	/** @ignore */
	__hasMixins() {
		return !!this[_mixins];
	}

	/** @ignore */
	__mixins() {
		return this[_mixins];
	}
}



