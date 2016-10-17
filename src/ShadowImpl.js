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
const _cache = Symbol('cache');
const _changed = Symbol('changed');
const _date = Symbol('date');
const _dead = Symbol('dead');
const _didShadowCalled = Symbol('didShadowCalled');
const _futureState = Symbol('futureState');
const _name = Symbol('name');
const _nextName = Symbol('nextName');
const _path = Symbol('path');
const _parent = Symbol('parent');
const _preventUpdates = Symbol('preventUpdates');
const _previousTime = Symbol('previousTime');
const _property = Symbol('property');
const _readonly = Symbol('readonly');
const _replaced = Symbol('replaced');
const _root = Symbol('root');
const _scheduled = Symbol('scheduled');
const _shader = Symbol('shader');
const _shadow = Symbol('shadow');
const _state = Symbol('state');
const _store = Symbol('store');
const _time = Symbol('time');

// private method symbols
const _defineProperty = Symbol('defineProperty');
const _modelForUpdate = Symbol('modelForUpdate');
const _scheduleUpdate = Symbol('scheduleUpdate');
const _changeRoot = Symbol('changeRoot');


export default class ShadowImpl {
	constructor(time, property, name, state, parent, shader, prev) {
		this[_property] = property;
		this[_name] = name;
		this[_parent] = parent;
		this[_shader] = shader;   // access through shader() method
		this[_state] = state;
		this[_store] = property.store();
		this[_time] = time;
		this[_previousTime] = prev && prev[_time];

// TODO: quick hack till have unit tests and thought out life-cycle design
		// didShadow() is being called multiple times which is causing a problem with property
		// initialization that should only occur once.
		this[_didShadowCalled] = false;

		this[_root] = parent ?parent[_root] :this;

		// flag marks this property as obsolete and thus no longer to effect updates on the
		// next data model
		this[_preventUpdates] = false;

		// flag indicating property has pending updates. Not safe to rely on this[_futureState] as it could be
		// undefined if that is the next value
		this[_changed] = false;

		if (parent && parent[_access].create$ForChild) {
			// property does not know about this impl yet. So impl.property() will work but property.__() will not
			this[_access] = parent[_access].create$ForChild(this);
		} else {
			this[_access] = property.create$(this);
		}

		// cache of values to avoid recalculations
		this[_cache] = {};
	}

	access() {
		return this[_access];
	}

	name() {
		return this[_name];
	}

	parent() {
		return this[_parent];
	}

	property() {
		return this[_property];
	}

	readonly() {
		return this[_readonly];
	}

	root() {
		return this[_root];
	}

	state() {
		return this[_state];
	}

	store() {
		return this[_store];
	}

	time() {
		return this[_time];
	}


	//------------------------------------------------------------------------------------------------------
	// State lifecycle methods
	//------------------------------------------------------------------------------------------------------

	// /* subscribe to websockets */
	// propertyDidShadow() {}

	// /* subscribe to websockets */
	// propertyDidShadow() {}

	// /* pre reshadow - chance to look at children states so do adapter type stuff */
	// propertyWillUpdate() { }

	// /* post reshadow - might want to do something */
	// propertyDidUpdate() {}

	// /* unsubscribe to websockets */
	// propertyWillUnshadow() {}

	// /* not sure what to do here */
	// propertyDidUnshadow() {}


	//------------------------------------------------------------------------------------------------------
	// Public API - should be no reason to override
	//------------------------------------------------------------------------------------------------------

	/*
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

	/*
		Prevents all children from being able to obtain model in update() callbacks. Update callbacks
		should invoke this method when they perform wholesale
	*/
	blockFurtherChildUpdates() {
		if (!this.hasChildren()) { return }

		const children = this.children();

		for (let i=0, child; child=children[i]; i++) {
			child.blockFurtherUpdates();
		}
	}

	/*
		Prevents this property and descendents from providing a model to update() callbacks.

		The update() method invokes this method when the callback returns a different object than the
		one passed into the callback.
	*/
	blockFurtherUpdates() {
		this[_preventUpdates] = true;
		this.invalidate(null, this);

		this.blockFurtherChildUpdates();
	}

	changeParent(newParent) {
		assert( a => a.is(this.isValid(), `Property must be valid to change parent: ${ this.dotPath() }`)
			          .not(this.isRoot(), `Root properties do not have parents: ${ this.dotPath() }`) );

		debug( d => d(`changeParent(): ${this.dotPath()}`) );

		var prevParent = this[_parent];
		this[_parent] = newParent;

		this[_changeRoot](newParent[_root]);

		// clear cache
		this[_cache] = {};

		// setup access through shadows
		this[_defineProperty]();

		//give subclasses a chance to perform setup operations on the new parent/tree
		this.onParentChange(newParent, prevParent);
	}

	didShadow(time, newRoot) {
		const storeRootImpl = this[_store].rootImpl;

		if (this[_time] == time && !this[_didShadowCalled] && storeRootImpl === this[_root]) {
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

	/*
		Intended for use by update() and replaying actions.
	*/
	dispatchUpdate(action) {
		if (!this[_preventUpdates] && this.isUpdatable() && this.isActive()) {
			const { name, nextState, replace } = action;

			// Sending to store first ensures:
			// 1) nextState() returns value from before this udpate
			// 2) middleware provided chance to make changes to action
			this[_store].onPreStateUpdate(action, this);

			// replacing the current object prevents further next state changes for sub-properties
			if (replace) {
				this[_replaced] = true;
				// block child updates because replacement makes them unreachable
				this.blockFurtherChildUpdates();
				this.onReplaced();
			}

			// set the next model data
			this[_futureState] = nextState;

			// update the parent's future state to reference the state returned by the action
			if (!this.isRoot()) {
				const parentNextData = this[_parent][_modelForUpdate]();

				// do nothing if parentNextData is not assignable
				if (parentNextData && !isPrimitive(parentNextData)) {
					parentNextData[this[_name]] = nextState;
				}
			}

			this.invalidate(null, this);

			this[_store].onPostStateUpdate(action, this);
			this[_root][_scheduleUpdate]();
		}
	}

	/*
		Helpful debugging utility that returns the path joined by '.'. The root node will return the
		word 'root' for the path.
	*/
	dotPath() {
		if (!this[_cache].dotPath) {
			const path = this.path();

			this[_cache].dotPath = path.length ?path.join('.') :'root';
		}

		return this[_cache].dotPath;
	}

	ensureMounted() {
		if (this.isRoot() || this.__getCalled__) { return }

		result(this[_store].shadow, this.dotPath())
	}

	findByPath(path) {
		if (path.length === 0) { return this; }

		const next = this.getChild(path[0]);

		return next && next.findByPath(path.slice(1));
	}

	/*
		Gets if an update has occurred directly to this property.
	*/
	hasPendingChanges() {
		return this[_changed];
	}

	/*
		Gets if the property represents live data.
	*/
	isActive() {
		return !this[_dead];
	}

	isLeaf() {
		return !this.hasChildren();
	}

	/*
		Marks property and ancestors as invalid. This means this property or one of its children
		has been updated. The invalid flag is set to the earliest timestamp when this property
		or one of its children was changed.

		Parameters:
			childImpl - the child implementation triggering this call or undefined if this implementation
				started the invalidation process
			source - the shadow implementation that triggered the invalidation
	*/
	invalidate(childImpl, source=this) {
		if (childImpl) {
			this[_property].onChildInvalidated(childImpl.property(), source.property());
		}

		if (this.isValid() && this.isActive()) {
			this.invalid = true;

			if (this[_parent]) {
				this[_parent].invalidate(this, source);
			}
		}
	}

	isRoot() {
		return this[_root] === this;
	}

	/*
		Gets if this property or one of its child properties has pending updates. Returns true if there are no
		pending updates.
	*/
	isValid() {
		return !this.invalid;
	}

	latest() {
		return this[_store].findByPath(this.path());
	}

	/*
		Gets the name after all model updates are performed.
	*/
	nextName() {
		return this[_nextName] !== undefined ?this[_nextName] :this[_name];
	}

	/*
		Gets the model as it will be once all pending changes are recorded with the store. This must
		not be altered.
	*/
	nextState() {
		return this.hasPendingChanges() || !this.isValid() ?this[_futureState] :this.state();
	}

	/*
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

		this[_property].onPropertyDidUnshadow();
	}

	obsoleteChildren() {
		if (this.hasChildren()) {
			const children = this.children();

			for (let i=0, len=children.length; i<len; i++) {
				let pi = children[i];

				if (pi) {
					pi.obsoleteTree();
				}
			}
		}
	}

	/*
		Marks the entire subtree as inactive, aka dead.
	*/
	obsoleteTree(callback) {
		if (!this[_dead]) {
			this.obsolete(callback);
			this.obsoleteChildren();
		}
	}

	/*
		Gets an array with the property names/indices from the root to this property.
	*/
	path() {
		if (this.isRoot()) {
			return [];
		} else if (!this[_cache].path) {
			this[_cache].path = this[_parent].path().concat(this[_name]);
		}

		return this[_cache].path;
	}

	replaced() {
		return !!this[_replaced];
	}

	/*
		Invoked by reshadow() function for invalid parent property implementations when the directly
		managed state did not change.

		Calls the onReshadow(prev) method to provide subclasses an oppotunity to setup for futher
		action after a parent change.
	*/
	reshadowed(prev) {
		debug( d => d(`reshadowed(): ${this.dotPath()}, mapped=${prev.isMapped()}, time=${this[_time]}, prevTime=${prev[_time]}`) );

		if (prev.__getCalled__) {
			this._setupShadow(prev, true);
		}

		this.onReshadow(prev);
	}

	/*
		Sets the readonly flag which will prevent a 'set' function being set in defineProeprty().

		Note: this method must be called before defineProperty() is invoked or it will have no affect.
	*/
	setReadonly(readonly) {
		this[_readonly] = readonly;
	}

	/*
		Creates shadow properties for root properties and sets this property on the parent property for
		non-root properties.

		Note: This method is called by shadowProperty() and reshadow() functions.
	*/
	setupPropertyAccess(prev) {
		const property = this[_property];

		// Invoke property life-cycle method that starting an update
		prev ?property.onPropertyWillUpdate() :property.onPropertyWillShadow();
//		property.isActive() ?property.onPropertyWillUpdate() :property.onPropertyWillShadow();

		if (this.isRoot()) {
			this._setupShadow(prev);
			// let shadow = this._createShadow();
			// this.defineChildProperties();

			// // freeze shadows in dev mode to provide check not assigning to non-shadowed property
			// // this can have performance penalties so skip in production mode
			// if (process.env.NODE_ENV !== 'production') {
			// 	!Object.isFrozen(shadow) && Object.freeze(shadow);
			// }
		} else {
			this[_defineProperty](prev, !!prev);
		}
	}

	/*
		Gets the shader needed to recreate the shadow property for the state.
	*/
	shader(state) {
		return this[_property].shader(state);
	}

	/*
		Gets the user facing property represented by this implementation object.
	*/
	shadow() {
		if (!this.isMapped()) { throw new Error(`Property implementation not mapped: ${this.dotPath()}`) }

		// if (!this[_shadow]) {
		// 	const ShadowClass = this[_property].shadowClass();

		// 	this[_shadow] = new ShadowClass(this);

		// 	extendProperty(this[_property], this, this[_shadow]);
		// }

		return this[_shadow];
	}

	/*
		Helpful debugging utility that returns the path joined by '.'. The root node will return the
		word 'root' for the path.
	*/
	slashPath() {
		if (!this[_cache].slashPath) {
			const path = this.path();

			this[_cache].slashPath = path.length ?`/${path.join('/')}` :'/';
		}

		return this[_cache].slashPath;
	}

	/*
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

	/*
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

	/*
		Marks this property as dead. Once marked obsolete a property may not accept further updates.
		A property is updated when the state changes but not a wholesale replacement or a descendents's
		value has changed and the update process has completed.

		This method does not affect subproperties.
	*/
	updated() {
		this[_dead] = true;

		this.onUpdate();
	}

	/*
		Changes the name this property will have after updates. This is used when moving properties
		around in the model, such as when splice is used on an array. The nextName() method
		will return the property name for after updates are applied.

		Note: this method does not have any side effects beyond setting the _nextName instance
			variable. Subclasss will need to perform any book keeping associated with sub-properties.
	*/
	updateName(name) {
		this[_nextName] = name;
	}

	updatesAllowed() {
		return !this[_preventUpdates];
	}

	/*
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
			this[_store].waitFor( () => {
					const latest = this.latest();

					callback(latest && latest.shadow(), latest);
				});
		}
	}

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

	copyState() {
		return cloneDeep(this.state());
	}

	definePropertyGetValue(state) {
		return this._createShadow();
	}

	definePropertySetValue(newValue) {
		this.assign(newValue);
	}

	hasChildren() {
		return this.childCount() != 0;
	}

	/*
		Gets if this property type reprsents a primitive javascript type.
	*/
	isPrimitive() {
		return false;
	}

	/*
		Gets whether the property value supports calls to update().
	*/
	isUpdatable() {
		return true;
	}

	/*
		Provides subclasses a chance to perform setup operations when the parent changes.

		Note: unlike other onXyz() methods, this one invokes defineProperty() so you may
		      want to invoke this version if that is a desired behavior.
	*/
	onParentChange(parent, prevParent) {
	}

	/*
		Map properties so can reuse valid properties. Reusing properties allows for React components
		to do '===' to see if a property has changed.
	*/
	onReshadow(prev) { }

	/*
		Hook for when this property is no longer represented in the system state.
	*/
	onReplaced() { }

	/*
		Hook for when this property is no longer represented in the system state due to a state
		update - not a replacement.
	*/
	onUpdate() { }


	//------------------------------------------------------------------------------------------------------
	//	Methods that ShadowImpl subclasses must be implemented by subclasses
	//------------------------------------------------------------------------------------------------------

	/*
		Merges a new state into this property by using the 'state' parameter to set default values, ie it
		will not overwrite any existing values. Useful when model objects arrive from external sources,
		such as an asyncrhonous save or a websocket based update.
	*/
	defaults(state) {
		throw new Error("ShadowImpl subclasses must implement defaults()");
	}

	/*
		Merges a new state into this property. Useful when model objects arrive from external
		sources, such as an asyncrhonous save or a websocket based update.
	*/
	merge(state) {
		throw new Error("ShadowImpl subclasses must implement merge()");
	}


	//------------------------------------------------------------------------------------------------------
	//	Methods that ShadowImpl subclasses with children must implement
	//------------------------------------------------------------------------------------------------------

	/*
		Invoked during defineProperty() to define children properties marked for automount
	*/
	automountChildren() {
//		throw new Error("ShadowImpl subclasses with children must implement children()");
	}

	/*
		Subclasses should implement this method in such a way as not to trigger a mapping.
	*/
	childCount() {
		return 0;
	}

	/*
		Gets the implementation objects managed by this property.
	*/
	children() {
		throw new Error("ShadowImpl subclasses with children must implement children()");
	}

	/*
		Create a copy of the internals during reshadowing when the property has not changed during the
		update process but some descendant has been modified.
	*/
	createCopy(time, newModel, parentImpl) {
		const property = this[_property];
		const ImplClass = property.implementationClass();
		const shader = this.shader(newModel);

		return new ImplClass(time, property, this[_name], newModel, parentImpl, shader, this);
	}

	/*
		Gets a child implementation matching a property name or undefined if no such property exists.
	*/
	getChild(name) {
		return undefined;
	}

	/*
		Gets if defineChildProperties() has been invoked.
	*/
	isMapped() {
		return true;
	}

	/*
		Gets the keys/indices for this property.

		Implementation note: Subclasses should implement this method in such a way as not to trigger a mapping.
	*/
	keys() {
		throw new Error("ShadowImpl subclasses with children must implement keys()");
	}

	/*
		Maps all child properties onto this property using Object.defineProperty().
	*/
	defineChildProperties() { }


	//------------------------------------------------------------------------------------------------------
	//	Private functions - should not be called by code outside this file. Usually put outside class
	//  and call using bind operator (::) but a lot slower and this class needs to be as efficient as
	//  possible
	//------------------------------------------------------------------------------------------------------

	/*
		Called during reshadowing when reusing a property. The function sets the root reference for this property
		and its descendants
	*/
	[_changeRoot](newRoot) {
		this[_root] = newRoot;

		if (this.hasChildren()) {
			const children = this.children();

			for (let i=0, len=children.length; i<len; i++) {
				children[i][_changeRoot](newRoot);
			}
		}
	}

	_createShadow() {
		if (!this[_shadow]) {
			let ShadowClass = this[_property].shadowClass();

			this[_shadow] = new ShadowClass(this);
			extendProperty(this[_property], this, this[_shadow]);
		}

		return this[_shadow];
	}

	_setupShadow(prev, inCtor) {
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

	/*
		Maps the getter and setter (if appropriate) onto the parent property.
	*/
	[_defineProperty](prev) {
		if (this.isRoot()) { return }

		// names with a leading '_' are not enumerable (way of hiding them)
		const enumerable = !(isString(this[_name]) && this[_name].startsWith('_'));
		const parentShadow = this[_parent].shadow();
		const state = this.state();
		const set = this[_readonly]
			?undefined
			:newValue => {
					if (!this.isActive())  { return }

					return this.definePropertySetValue(newValue);
				}

if (this.dotPath() === 'aws') debugger
		try {
			Object.defineProperty(parentShadow, this[_name], {
					enumerable: enumerable,
					get: () => {
							if (isSomething(state)) {
								return this._setupShadow();
							} else {
								return state;
							}
						},
					set: set
				});
		} catch(error) {
			console.warn(`_defineProperty() Error: name=${this[_name]}, parent=${this[_parent].dotPath()}`, error.stack);
			debugger
		}

		this.automountChildren(prev);
	}

	/*
		Gets the next model state for the property. This value is used for performing property updates through
		the update() function.

		Calls to update() trigger an update through the dispatcher upon which the new object will be mapped
		and the store informed of the change.
	*/
	[_modelForUpdate]() {
		if (!this[_futureState]) {
			if (this.isRoot()) {
				// next data will be a shallow copy of current model
				this[_futureState] = clone(this.state());
			} else {
				const parentNextState = this[_parent][_modelForUpdate]();

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

		return this[_futureState];
	}

	/*
		Schedules an UPDATE action with the dispatcher. On action execution, the new property will be generated
		and returned to the store.
	*/
	[_scheduleUpdate]() {
		if (!this.isRoot()) {
			return this[_root][_scheduleUpdate]();
		}

		if (!this[_scheduled] && !this.isValid() && !this[_dead]) {
			// flag never gets cleared
			this[_scheduled] = true;

			this[_store].dispatchUpdate( time => reshadow(time, this[_futureState], this) );
		}
	}
}


