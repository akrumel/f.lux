import Symbol from "es6-symbol";
import has from "lodash.has";
import isEqual from "lodash.isequal";
import isPlainObject from "lodash.isplainobject";
import omit from "lodash.omit";

import ShadowImpl from "./ShadowImpl";
import reshadow from "./reshadow";


// private variable names
const _automounted = Symbol('automounted');
const _impls = Symbol('impls');
const _mapped = Symbol('mapped');
const _nextMapping = Symbol('nextMapping');
const _size = Symbol('size');
const _shadow = Symbol('shadow');


export default class ObjectShadowImpl extends ShadowImpl {
	constructor(time, property, name, state, parent, shader, prev) {
		super(time, property, name, state, parent, shader, prev);

		this[_mapped] = false;
		this[_impls] = {};
	}

	/*
		Remove invalid but still active children.
	*/
	onReshadow(prev) {
		// Kill invalid() nodes that are still active
		prev._killInvalidButActiveChildren();
	}

	/*
		Gets the child implementation mapping (key : impl) for the next state. Use this method to get the
		mapping when not making changes but just interested in using the next state. This method is more
		efficient when not making changes because it will use the initial state mapping when no state
		changes have been made.
	*/
	childMapping() {
		return this[_nextMapping] || this[_impls];
	}

	/*
		Gets the mapping used for making future state changes.
	*/
	nextMapping() {
		if (this[_nextMapping] === undefined) {
			this.ensureMounted();

			if (!this.isMapped()) {
				this.defineChildProperties();
			}

			this[_nextMapping] = { ...this[_impls] };
		}

		return this[_nextMapping];
	}

	/*
		Removes a child property from further updates. Child will still be accessible for getting the
		current value until next update cycle.

		Parameters:
			child - the child property implementation instance
	*/
	removeChild(child) {
		child.blockFurtherUpdates(true);
	}

	/*
		Removes a child property from further updates. Child will still be accessible for getting the
		current value until next update cycle.

		Parameters:
			key - the child property key
	*/
	removeChildAt(key) {
		const mapping = this.nextMapping();
		const child = mapping[key];

		if (child) {
			this.removeChild(child);
		}
	}

	toJSON() {
		return {
			...super.toJSON(),
			mapped: this[_mapped],
			type: 'KeyedShadowImpl',
		};
	}


	//------------------------------------------------------------------------------------------------------
	// Methods for access and manipulate subproperties.
	//------------------------------------------------------------------------------------------------------

	/*
		Removes all subproperties.
	*/
	clear() {
		return this.update( state => {
				return { name: "clear()", nextState: {} };
			});
	}

	/*
		Removes a subproperty from this state property.
	*/
	delete(key) {
		this.update( state => {
				this.removeChildAt(key);

				return { name: `delete(${key})`, nextState: omit(state, key) };
			});
	}

	/*
		Gets a copy of the implementation objects. Returns an object.
	*/
	entries() {
		return { ...this[_impls] };
	}

	extend(sources) {
		this.update( state => {
				if (state) {
					return {
						name: "extend()",
						nextState: Object.assign({ }, state, ...sources),
						replace: true
					}
				} else {
					return { name: `extend()`, nextState: state };
				}
			});
	}

	/*
		Gets the property implementation for a state property.
	*/
	get(k) {
		return this[_impls][k];
	}

	/*
		Gets if this state property has a subproperty with a specified name.
	*/
	has(k) {
		return has(this[_impls], k);
	}

	/*
		Gets the keys of all managed subproperties. Returns an array.
	*/
	keys() {
		return Object.keys(this[_impls]);
	}

	/*
		Sets a subproperty value. Replaces current state property if one has an identical name.
	*/
	set(k, v) {
		this.update( state => {
				this.removeChildAt(k);

				if (state) {
					return { name: `set(${k})`, nextState: { ...state, [k]: v } };
				} else {
					return { name: `set(${k})`, nextState: state };
				}
			});

		return this;
	}

	size() {
		return this.childCount();
	}

	/*
		Gets subproperty implementation objects. Returns an array.
	*/
	values() {
		return Object.values(this[_impls]);
	}


	//------------------------------------------------------------------------------------------------------
	//	Methods that must be implemented by subclasses
	//------------------------------------------------------------------------------------------------------

	defaults(state) {
		// bail if new state is not an object
		if (!isPlainObject(state)) {
			// nothing to do
			return ;
		}

		const impls = this.childMapping();
		const keys = Object.keys(impls);
		const stateKeys = Object.keys(state);
		var key, stateValue, child;

		for (let i=0, len=stateKeys.length; i<len; i++) {
			key = stateKeys[i];
			stateValue = state[key];
			child = impls[key];

			if (child) {
				child.defaults(stateValue);
			} else {
				this.set(key, stateValue);
			}
		}
	}

	merge(state) {
		// bail if new state is not an object
		if (!isPlainObject(state)) {
			return this.assign(state);
		}

		const impls = this.childMapping();
		const keys = Object.keys(impls);
		const stateKeys = Object.keys(state);
		var key, stateValue, child;

		for (let i=0, len=stateKeys.length; i<len; i++) {
			key = stateKeys[i];
			child = impls[key];
			stateValue = state[key];

			if (child) {
				child.merge(stateValue);
			} else {
				this.set(key, stateValue);
			}
		}
	}


	//------------------------------------------------------------------------------------------------------
	//	Methods that subclasses with children must implement
	//------------------------------------------------------------------------------------------------------

	automountChildren(prev) {
		if (this[_mapped] || this[_automounted]) { return }

		this[_automounted] = true;

		const state = this.state();
		const shader = this.shader(state);

		for (let name in state) {
			if (shader.isAutomount(name)) {
				this.defineChildProperty(name, shader, state, prev, true);
			}
		}
	}

	/*
		Subclasses should implement this method in such a way as not to trigger a mapping.
	*/
	childCount() {
		if (!this.state()) { return 0 }

		if (this[_size] === undefined) {
			this[_size] = Object.keys(this.state()).length;
		}

		return this[_size];
	}

	/*
		Gets the implementation objects managed by this property.
	*/
	children() {
		return Object.values(this[_impls]);
	}

	/*
		Maps all child properties onto this property using Object.defineProperty().
	*/
	defineChildProperties(prev, inCtor) {
		if (this[_mapped]) { return }

		this[_mapped] = true;

		const state = this.state();
		const shader = this.shader(state);
		var child, elementShader;

		for (let name in state) {
			if (!state.hasOwnProperty(name)) { continue }

			elementShader = shader.shaderFor(name, state);

			if (!elementShader) {
				console.warn(`KeyedShadowImpl.defineChildProperties() - no shader found - name=${name}, path=${this.dotPath()}`);
				continue;
			}

			this.defineChildProperty(name, elementShader, state, prev, inCtor);
		}

		if (isPlainObject(state)) {
			shader.shadowUndefinedProperties(state, this, (name, shader) => {
					this.defineChildProperty(name, shader, state, prev, inCtor);
				});
		}
	}

	defineChildProperty(name, elementShader, state, prev, inCtor=false) {
		// ensure not already defined
		if (this[_impls][name]) { return }

		const prevChild = prev && prev[_impls][name];
		var child;

		if (prevChild && !prevChild.replaced()) {
			child = reshadow(this.time(), state, prevChild, this);
		} else {
			child = elementShader.shadowProperty(this.time(), name, state, this);
		}

		if (child) {
			this[_impls][name] = child;

			if (!prevChild && !inCtor) {
				child.didShadow(this.time());
			}
		}
	}

	/*
		Gets a child implementation matching a property name or undefined if no such property exists.
	*/
	getChild(name) {
		return this.get(name);
	}

	isMapped() {
		return this[_mapped];
	}

	/*
		Gets the keys/indices for this property.

		Implementation note: Subclasses should implement this method in such a way as not to trigger a mapping.
	*/
	keys() {
		return Object.keys(this.state());
	}

	_killInvalidButActiveChildren() {
		// kill any unvisited children from previous implementation
		const prevNames = Object.keys(this[_impls]);
		var child;

		for (let i=0, len=prevNames.length; i<len; i++) {
			child = this[_impls][prevNames[i]];

			if (!child.isValid() && child.isActive()) {
				child.obsoleteTree();
			}
		}
	}
}