import clone from "lodash.clone";
import cloneDeep from "lodash.clonedeep";
import isString from "lodash.isstring";
import result from "lodash.result";

import {
	assert,
	isPrimitive,
	isSomething,
} from "akutils";

import Access from "./Access";
import extendProperty from "./extendProperty";
import isShadow from "./isShadow";
import reshadow from "./reshadow";

import appDebug, { ShadowImplKey as DebugKey } from "./debug";
const debug = appDebug(DebugKey);


// instance variable names
const _access = Symbol('access');
// object to store expensive derived values
const _cache = Symbol('cache');
// flag indicating property has pending updates. Not safe to rely on this[_futureState] as it could be
// undefined if that is the next value
const _changed = Symbol('changed');
const _date = Symbol('date');
const _dead = Symbol('dead');
const _didShadowCalled = Symbol('didShadowCalled');
const _futureState = Symbol('futureState');
const _hasFutureState = Symbol('hasFutureStatee');
const _invalid = Symbol('invalid');
const _name = Symbol('name');
const _nextName = Symbol('nextName');
const _path = Symbol('path');

// flag marks this property as obsolete and thus no longer to effect updates on the
// next data model
const _preventUpdates = Symbol('preventUpdates');
const _previousTime = Symbol('previousTime');
const _property = Symbol('property');
const _readonly = Symbol('readonly');
const _replaced = Symbol('replaced');
const _scheduled = Symbol('scheduled');
const _shadow = Symbol('shadow');
const _state = Symbol('state');
const _time = Symbol('time');

// private method symbols
const _createShadow = Symbol('createShadow');
const _defineProperty = Symbol('defineProperty');
const _modelForUpdate = Symbol('modelForUpdate');
const _scheduleUpdate = Symbol('scheduleUpdate');
const _setupShadow = Symbol('setupShadow');


/*
	Todos:
		* Isolated support
			-

		* Reduce memory footprint:
			1) investigate _time and _previousTime really needed
			2) investigate getting access from property (reduce object creation and memory footprint)

		* Investigate replacing impl with Proxy
*/

/**
	The base class for {@link Shadow} backing objects. Each shadow property has an 'impl' that
	performs the f.lux bookkeeping to enable the shadow state to work properly. The 'impl' is
	broken out from the shadow proper to prevent polluting the namespace with a bunch of crazy
	looking variables and methods.

	A shadow property's 'impl' is available through the {@link Shadow.__} method. Direct access
	to the 'impl' is rarely needed by custom properties, shadows, or application logic. And there
	almost certainly no reason to directly subclass this class.

	@see {@link Shadow.__}
*/
export default class ShadowImpl {
	constructor(time, property, name, state, parent, shader, prev) {
		this[_property] = property;
		this[_name] = name;
		this[_state] = state;
		this[_time] = time;

		if (prev) {
			this[_previousTime] = prev[_time];
		}

// TODO: quick hack till have unit tests and thought out life-cycle design
		// didShadow() is being called multiple times which is causing a problem with property
		// initialization that should only occur once.
		this[_didShadowCalled] = false;
	}

	/**
		Alias for {@link ShadowImpl.shadow}.
	*/
	_() {
		return this.shadow();
	}

	access() {
		const parent = this.parent();

		if (!this[_access]) {
			if (parent && parent.access().create$ForChild) {
				// property does not know about this impl yet. So impl.property() will work but property.__() will not
				this[_access] = parent.access().create$ForChild(this);
			} else {
				this[_access] = this[_property].create$(this);
			}
		}

		return this[_access];
	}

	/**
		Replace the value of this property. This will result in this property tree being recreated.

		Note: This value will be used directly (not copied) so ensure the state is not altered.
	*/
	assign(nextState, name) {
		nextState = isShadow(nextState) ?nextState.__().state() :nextState;

		//create a deep copy so not shared with the passed in value
		//this.deepcopy() will use current model if no value passed or value passed is null or undefined
		//in case of assigned those are legal values so must check explicitly
		return this.update( state => {
				return { name: name || "assign()", nextState, replace: true  };
			});
	}

	/**
		Prevents all children from being able to obtain model in update() callbacks. Update callbacks
		should invoke this method when they perform wholesale
	*/
	blockFurtherChildUpdates() {
		if (!this.hasChildren()) { return }

		const children = this.children();

		for (let i=0, child; child=children[i]; i++) {
			child.blockFurtherUpdates(true);
		}
	}

	/**
		Prevents this property and descendents from providing a model to update() callbacks.

		The update() method invokes this method when the callback returns a different object than the
		one passed into the callback.
	*/
	blockFurtherUpdates(replaced) {
		this[_preventUpdates] = true;
		this.invalidate(null, this);

		if (replaced) {
			this[_replaced] = true;
		}

		this.blockFurtherChildUpdates();
	}

	changeParent(newParent) {
		assert( a => a.is(this.isValid(), `Property must be valid to change parent: ${ this.dotPath() }`)
			          .not(this.isRoot(), `Root properties do not have parents: ${ this.dotPath() }`) );

		debug( d => d(`changeParent(): ${this.dotPath()}`) );

		// clear cache
		delete this[_cache];

		// setup access through shadows
		this[_defineProperty]();
	}

	cache() {
		if (!this[_cache]) {
			this[_cache] = {};
		}

		return this[_cache];
	}

	/**
		Create a copy of the internals during reshadowing when the property has not changed during the
		update process but some descendant has been modified.
	*/
	createCopy(time, newModel, parentImpl) {
		const property = this[_property];
		const ImplClass = property.implementationClass();
		const name = this.nextName();
		const shader = this.shader(newModel);

		return new ImplClass(time, property, name, newModel, parentImpl, shader, this);
	}

	didShadow(time, newRoot) {
		const storeRootImpl = this.store().__;

		if (this[_time] == time && !this[_didShadowCalled] && storeRootImpl === this.root()) {
			this[_didShadowCalled] = true;

			if (this.isRoot()) {
				if (this[_previousTime] || !newRoot) {
					this[_property].onPropertyDidUpdate();
				} else {
					this[_property].onPropertyDidShadow();
				}
			} else {
				this[_previousTime] ?this[_property].onPropertyDidUpdate() :this[_property].onPropertyDidShadow();
			}

			if (this.hasChildren()) {
				const children = this.children();
				var childImpl;

				for (let i=0, len=children.length; i<len; i++) {
					let childImpl = children[i];

					if (childImpl) {
						childImpl.didShadow(time);
					}
				}
			}
		}
	}

	/**
		Intended for use by update() and replaying actions.
	*/
	dispatchUpdate(action) {
		if (!this[_preventUpdates] && this.isUpdatable() && this.isActive()) {
			const { name, nextState, replace } = action;

			// Sending to store first ensures:
			// 1) nextState() returns value from before this udpate
			// 2) middleware provided chance to make changes to action
			this.store().onPreStateUpdate(action, this);

			// replacing the current object prevents further next state changes for sub-properties
			if (replace) {
				this[_replaced] = true;
				// block child updates because replacement makes them unreachable
				this.blockFurtherChildUpdates();
				this.onReplaced();
			}

			// set the next model data
			this[_futureState] = nextState;
			this[_hasFutureState] = true;

			// update the parent's future state to reference the state returned by the action
			if (!this.isRoot()) {
				const parentNextData = this.owner()[_modelForUpdate]();

				// do nothing if parentNextData is not assignable
				if (parentNextData && !isPrimitive(parentNextData)) {
					parentNextData[this[_name]] = nextState;
				}
			}

			this.invalidate(null, this);

			this.store().onPostStateUpdate(action, this);
			this.root()[_scheduleUpdate]();
		}
	}

	/**
		Helpful debugging utility that returns the path joined by '.'. The root node will return the
		word 'root' for the path.
	*/
	dotPath() {
		const cache = this.cache();

		if (!cache.dotPath) {
			const path = this.path();

			cache.dotPath = path.length ?path.join('.') :'root';
		}

		return cache.dotPath;
	}

	ensureMounted() {
		if (this.isRoot() || this.isIsolated() || this.__getCalled__) { return }

		result(this.store().shadow, this.dotPath())
	}

	findByPath(path) {
		if (path.length === 0) { return this; }

		const next = this.getChild(path[0]);

		return next && next.findByPath(path.slice(1));
	}

	/**
		Gets if an update has occurred directly to this property.
	*/
	hasPendingChanges() {
		return !!this[_changed];
	}

	/**
		Marks property and ancestors as invalid. This means this property or one of its children
		has been updated. The invalid flag is set to the earliest timestamp when this property
		or one of its children was changed.

		Parameters:
			childImpl - the child implementation triggering this call or undefined if this implementation
				started the invalidation process
			source - the shadow implementation that triggered the invalidation
	*/
	invalidate(childImpl, source=this) {
		const owner = this.owner();

		if (childImpl) {
			this[_property].onChildInvalidated(childImpl.property(), source.property());
		}

		if (this.isValid() && this.isActive()) {
			this[_invalid] = true;

			if (owner) {
				owner.invalidate(this, source);
			}

			this.onInvalidated();
		}
	}

	/**
		Gets if the property represents live data.
	*/
	isActive() {
		return !this[_dead];
	}

	isIsolated() {
		return this.property().isIsolated();
	}

	isLeaf() {
		return !this.hasChildren();
	}

	isRoot() {
		return this.property().isRoot();
	}

	/**
		Gets if this property or one of its child properties has pending updates. Returns true if there are no
		pending updates.
	*/
	isValid() {
		return !this[_invalid];
	}

	latest() {
		return this.store().findByPath(this.path());
	}

	name() {
		return this[_name];
	}

	/**
		Gets the name after all model updates are performed.
	*/
	nextName() {
		return this[_nextName] !== undefined ?this[_nextName] :this[_name];
	}

	/**
		Gets the model as it will be once all pending changes are recorded with the store. This must
		not be altered.
	*/
	nextState() {
		return this[_hasFutureState] ?this[_futureState] :this.state();
	}

	/**
		Marks this property as obsolete. Once marked obsolete a property may not interact with the store.
		A property becomes obsolete after it's value or ancestor's value has changed and the update process
		has completed.

		This method does not affect subproperties.
	*/
	obsolete(callback) {
		if (callback) {
			callback(this);
		}

		this[_dead] = true;

		this.onObsolete();
	}

	obsoleteChildren() {
		if (this.hasChildren()) {
			const children = this.children();

			for (let i=0, len=children.length; i<len; i++) {
				let child = children[i];

				if (child) {
					child.obsoleteTree();
				}
			}
		}
	}

	/**
		Marks the entire subtree as inactive, aka dead.
	*/
	obsoleteTree(callback) {
		if (!this[_dead]) {
			this.obsolete(callback);
			this.obsoleteChildren();
		}
	}

	owner() {
		const ownerProperty = this[_property].owner();

		return ownerProperty && ownerProperty.__();
	}

	parent() {
		const parentProperty = this.property().parent();

		return parentProperty && parentProperty.__();
	}

	/**
		Gets an array with the property names/indices from the root to this property.
	*/
	path() {
		const cache = this.cache();

		if (this.isRoot()) {
			return [];
		} else if (!cache.path) {
			cache.path = this.parent().path().concat(this[_name]);
		}

		return cache.path;
	}

	property() {
		return this[_property];
	}

	readonly() {
		return this[_readonly] === undefined ?this[_property].isReadonly() :this[_readonly];
	}

	replaced() {
		return !!this[_replaced];
	}

	/**
		Invoked by reshadow() function for invalid parent property implementations when the directly
		managed state did not change.

		Calls the onReshadow(prev) method to provide subclasses an oppotunity to setup for futher
		action after a parent change.
	*/
	reshadowed(prev) {
		debug( d => d(`reshadowed(): ${this.dotPath()}, mapped=${prev.isMapped()}, time=${this[_time]}, prevTime=${prev[_time]}`) );

		if (prev.__getCalled__) {
			this[_setupShadow](prev, true);
		}

		this.onReshadow(prev);
	}

	root() {
		if (this[_property].isRoot()) { return this }

		const cache = this.cache();

		if (!cache.root || !cache.root.isActive()) {
			cache.root = this.owner().root();
		}

		return cache.root;
	}

	/**
		Sets the readonly flag which will prevent a 'set' function being set in defineProeprty().

		Note: this method must be called before defineProperty() is invoked or it will have no affect.
	*/
	setReadonly(readonly) {
		this[_readonly] = readonly;
	}

	/**
		Creates shadow properties for root properties and sets this property on the parent property for
		non-root properties.

		Note: This method is called by shadowProperty() and reshadow() functions.
	*/
	setupPropertyAccess(prev) {
		const property = this[_property];

		if (this.isRoot() || this.isIsolated()) {
			this[_setupShadow](prev);
		} else {
			this[_defineProperty](prev);
		}
	}

	/**
		Gets the shader needed to recreate the shadow property for the state.
	*/
	shader(state) {
		return this[_property].shader(state);
	}

	/**
		Gets the user facing property represented by this implementation object.
	*/
	shadow() {
		// Not ok to map this property if parent is not yet mapped
		if (!this.isMapped() && this.parent() && !this.parent().isMapped()) {
			throw new Error(`Property implementation not mapped: ${this.dotPath()}`);
		}

//		if (!this.isMapped()) { throw new Error(`Property implementation not mapped: ${this.dotPath()}`) }

		return this[_setupShadow]()
	}

	/**
		Helpful debugging utility that returns the path joined by '.'. The root node will return the
		word 'root' for the path.
	*/
	slashPath() {
		const cache = this.cache();

		if (!cache.slashPath) {
			const path = this.path();

			cache.slashPath = path.length ?`/${path.join('/')}` :'/';
		}

		return cache.slashPath;
	}

	state() {
		return this[_state];
	}

	store() {
		return this[_property].store();
	}

	/**
		Transfers the nextName to the name attribute.
	*/
	switchName() {
		if (this[_nextName] !== undefined) {
			this[_name] = this[_nextName];
			delete this[_nextName];
		}
	}

	time() {
		return this[_time];
	}

	/**
		Gets a compact version of this internal's state. It does NOT provide a JSON representation of the
		model state. The actual Property.toJSON() method returns the model JSON representation.
	*/
	toJSON() {
		return {
			name: this[_name],
			path: this.dotPath(),
			active: !this[_dead],
			valid: this.isValid(),
			state: this.state(),
		}
	}

	//Gets a stringified version of the toJSON() method.
	toString() {
		return JSON.stringify(this);
	}

	/**
		Makes changes to the next property state. The callback should be pure (no side affects) but that
		is not a requirement. The callback must be of the form:

			(state) => return { nextState, replace }

		where:
			state - the next property state
			nextState - the state following the callback
			replace - boolean for whether nextState replaces the current value. The implication of true
				is that this property and all of it's children will not be able to make future changes
				to the model.

		To understand the reasoning behind the replace flag consider the following example:

			const model = { a: { b: { c: 1 } } }
			const oldB = model.a.b

			model.a.b = "foo"
			oldB.c = 5

			model.a.b.c === undefined

		Thus, oldB.c may change oldB'c property 'c' to 5 but model.a.b is still "foo".
	*/
	update(callback) {
		assert( a => a.is(this.isActive(), `Property is not active: ${ this.dotPath() }`) );

		if (!this[_preventUpdates] && this.isUpdatable() && this.isActive()) {
			const next = this[_modelForUpdate]();

			// invoke callback without bind context to reduce overhead
			const action = callback(next);
			const { nextState, replace } = action;

			// mark property as having pending updates if the action callback returns a different
			// object/value or requests a replacement be created. An example where neither would be
			// true is a property touch() call because its shadow function signature changed.
			if (nextState !== next || replace) {
				this[_changed] = true;
			}

			this.dispatchUpdate(action);

			return true;
		}

		return false;
	}

	/**
		Marks this property as dead. Once marked obsolete a property may not accept further updates.
		A property is updated when the state changes but not a wholesale replacement or a descendents's
		value has changed and the update process has completed.

		This method does not affect subproperties.
	*/
	updated() {
		this[_dead] = true;

		this.onUpdate();
	}

	/**
		Changes the name this property will have after updates. This is used when moving properties
		around in the model, such as when splice is used on an array. The nextName() method
		will return the property name for after updates are applied.

		Note: this method does not have any side effects beyond setting the _nextName instance
			variable. Subclasss will need to perform any book keeping associated with sub-properties.
	*/
	updateName(name) {
		this[_nextName] = name;
	}

	/**
		Gets if shadow property is allowing state updates.

		@return {boolean} `false` if the property or its parent has been replaced, `true` otherwise.
	*/
	updatesAllowed() {
		return !this[_preventUpdates] && !this[_replaced];
	}

	/**
		Invokes a callback once all pending changes have occurred. The callback should have the form:

			callback(property, implementation)

		where the property and implementation arguments are the latest version if they still exist.

		This method is safe to call on a dead property.
	*/
	waitFor(callback) {
		if (this.isValid() && this.isActive()) {
			// short circuit if no changes pending
			callback(this.shadow());
		} else {
			this.store().waitFor( () => {
					const latest = this.latest();

					callback(latest && latest.shadow(), latest);
				});
		}
	}

	/**
		Invoked by the shadowing process to invoke appropriate {@link Property} life-cycle methods.
		The method name is a reflection that shadow state tree invocation chain for `willShadow()`
		occurs when the {@link Store} is going to shadow that state.

		@param {boolean} parentWillUnshadow - `true` when parent property is unshadowing.
	*/
	willShadow(parentWillUnshadow) {
		var willUnshadow = parentWillUnshadow || false;

		if (parentWillUnshadow) {
			// all properties under an unshadowed proeprty also get unshadowed
			this[_property].onPropertyWillUnshadow();
			willUnshadow = true;
		} else if (this.isValid()) {
			// nothing else to do since this property and all subproperties must be fine
			return;
		} else if (this[_replaced] || this[_preventUpdates]) {
			this[_property].onPropertyWillUnshadow();
			willUnshadow = true;
		}

		if (this.hasChildren()) {
			const children = this.children();
			var childImpl;

			for (let i=0, len=children.length; i<len; i++) {
				let childImpl = children[i];

				if (childImpl) {
					childImpl.willShadow(willUnshadow);
				}
			}
		}
	}


	//------------------------------------------------------------------------------------------------------
	//	Methods with base implementations that subclasses may need to override - no need to call super
	//------------------------------------------------------------------------------------------------------

	/**
		Creates a deep clone of the current property state.
	*/
	copyState() {
		return cloneDeep(this.state());
	}

	/**
		Invoked on shadow getter access to obtain the get value.

		The default implementation returns the shadow.

		@return the shadow or other f.lux representative value for the shadow proeprty.
	*/
	definePropertyGetValue(state) {
		return this[_createShadow]();
	}

	/**
		Invoked on shadow property assignment to perform the replacement f.lux action.

		The default implementation is to assign the new value with no checking.

		@param newValue - the new state value
	*/
	definePropertySetValue(newValue) {
		this.assign(newValue);
	}

	/**
		Gets if the property has an child properties (not whether child properties are supported).
	*/
	hasChildren() {
		return this.childCount() != 0;
	}

	/**
		Gets if this property type reprsents a primitive javascript type.
	*/
	isPrimitive() {
		return false;
	}

	/**
		Gets whether the property value supports calls to update().
	*/
	isUpdatable() {
		return true;
	}

	/**
		Property has been invalidated.
	*/
	onInvalidated() { }

	/**
		Property has been removed from the shadow state.
	*/
	onObsolete() { }

	/**
		Property has just been reshadowed.
	*/
	onReshadow(prev) { }

	/**
		Hook for when this property is no longer represented in the system state.
	*/
	onReplaced() { }

	/**
		Hook for when this property is no longer represented in the system state due to a state
		update - not a replacement.
	*/
	onUpdate() { }


	//------------------------------------------------------------------------------------------------------
	//	Methods that ShadowImpl subclasses must be implemented by subclasses
	//------------------------------------------------------------------------------------------------------

	/**
		Merges a new state into this property by using the 'state' parameter to set default values, ie it
		will not overwrite any existing values. Useful when model objects arrive from external sources,
		such as an asyncrhonous save or a websocket based update.
	*/
	defaults(state) {
		throw new Error("ShadowImpl subclasses must implement defaults()");
	}

	/**
		Merges a new state into this property. Useful when model objects arrive from external
		sources, such as an asyncrhonous save or a websocket based update.
	*/
	merge(state) {
		throw new Error("ShadowImpl subclasses must implement merge()");
	}


	//------------------------------------------------------------------------------------------------------
	//	Methods that ShadowImpl subclasses with children must implement
	//------------------------------------------------------------------------------------------------------

	/**
		Invoked during defineProperty() to define children properties marked for automount
	*/
	automountChildren() {
//		throw new Error("ShadowImpl subclasses with children must implement children()");
	}

	/**
		Subclasses should implement this method in such a way as not to trigger a mapping.
	*/
	childCount() {
		return 0;
	}

	/**
		Gets the implementation objects managed by this property.
	*/
	children() {
		throw new Error("ShadowImpl subclasses with children must implement children()");
	}

	/**
		Gets a child implementation matching a property name or undefined if no such property exists.
	*/
	getChild(name) {
		return undefined;
	}

	/**
		Maps all child properties onto this property using Object.defineProperty().

		@param {ShadowImpl} prev - the previous property shadow implementation instance.
		@param {boolean} inCtor - `true` if call occuring during shadowing process.
	*/
	defineChildProperties(prev, inCtor) { }

	/**
		Gets if defineChildProperties() has been invoked.
	*/
	isMapped() {
		return true;
	}

	/**
		Gets the keys/indices for this property.

		Implementation note: Subclasses should implement this method in such a way as not to trigger a mapping.
	*/
	keys() {
		throw new Error("ShadowImpl subclasses with children must implement keys()");
	}


	//------------------------------------------------------------------------------------------------------
	//	Private functions - should not be called by code outside this file.
	//------------------------------------------------------------------------------------------------------

	[_createShadow]() {
		if (!this[_shadow]) {
			let ShadowClass = this[_property].shadowClass();

			this[_shadow] = new ShadowClass(this);
			extendProperty(this[_property], this, this[_shadow]);
		}

		return this[_shadow];
	}

	[_setupShadow](prev, inCtor) {
		if (!this.__getCalled__) {
			let state = this.state();

			debug( d => d(`_setupShadow(): ${this.dotPath()}, time=${this[_time]}`) );

			this.__getCalled__ = true;
			var shadow = this.__getResonse__ = this.definePropertyGetValue(state);

			this.defineChildProperties(prev, inCtor);

			// freeze shadows in dev mode to provide check not assigning to non-shadowed property
			// this can have performance penalties so skip in production mode
			if (process.env.NODE_ENV !== 'production') {
				!Object.isFrozen(shadow) && Object.freeze(shadow);
			}
		}

		return this.__getResonse__;
	}

	/**
		Maps the getter and setter (if appropriate) onto the parent property.
	*/
	[_defineProperty](prev) {
		if (this.isRoot() || this.isIsolated()) { return }

		// names with a leading '_' are not enumerable (way of hiding them)
		const enumerable = !(isString(this[_name]) && this[_name].startsWith('_'));
		const parentShadow = this.parent().shadow();
		const state = this.state();
		const set = this.readonly()
			?undefined
			:newValue => {
					if (!this.isActive())  {
						if (process.env.NODE_ENV !== 'production') {
							console.error(`Attempting to set value on inactive property: ${this.dotPath()}`, newValue);
						}

						return
					}

					return this.definePropertySetValue(newValue);
				}

		try {
			Object.defineProperty(parentShadow, this[_name], {
					enumerable: enumerable,
					get: () => {
							if (isSomething(state)) {
								return this[_setupShadow]();
							} else {
								return state;
							}
						},
					set: set
				});
		} catch(error) {
			console.warn(`_defineProperty() Error: name=${this[_name]}, parent=${this.parent().dotPath()}`, error.stack);
			debugger
		}

		this.automountChildren(prev);
	}

	/**
		Gets the next model state for the property. This value is used for performing property updates through
		the update() function.

		Calls to update() trigger an update through the dispatcher upon which the new object will be mapped
		and the store informed of the change.
	*/
	[_modelForUpdate]() {
		if (!this[_hasFutureState]) {
			if (this.isRoot()) {
				// next data will be a shallow copy of current model
				this[_futureState] = clone(this.state());
			} else {
				const parentNextState = this.owner()[_modelForUpdate]();

				// Primitive parent models do not support adding properties
				if (isPrimitive(parentNextState)) {
					return undefined;
				}

				// next data is a shallow copy of the parent's value of this property
				this[_futureState] = clone(parentNextState[this[_name]]);

				// place a shallow clone in place of current value
				parentNextState[this.nextName()] = this[_futureState]
			}
		}

		this[_hasFutureState] = true;

		return this[_futureState];
	}

	/**
		Schedules an UPDATE action with the store. On action execution, the new property will be generated
		and returned to the store.
	*/
	[_scheduleUpdate]() {
		if (!this.isRoot()) {
			return this.root()[_scheduleUpdate]();
		}

		if (!this[_scheduled] && !this.isValid() && !this[_dead]) {
			// flag never gets cleared
			this[_scheduled] = true;

			this.store().dispatchUpdate( time => reshadow(time, this.nextState(), this) );
		}
	}
}


