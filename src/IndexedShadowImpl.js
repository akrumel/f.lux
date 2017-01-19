import flatten from "lodash.flatten";
import range from "lodash.range";

import ShadowImpl from "./ShadowImpl";
import modelizeArray from "./modelizeArray";
import reshadow from "./reshadow";


const _automounted = Symbol('automounted');
const _impls = Symbol('impls');
const _mapped = Symbol('mapped');
const _length = Symbol('length');
const _nextMapping = Symbol('nextMapping');
const _shadow = Symbol('shadow');

export default class IndexedShadowImpl extends ShadowImpl {
	constructor(time, property, name, state, parent, shader, prev) {
		super(time, property, name, state, parent, shader, prev);

		this[_mapped] = false;
		this[_impls] = [];

		// setup the length property
		this[_length] = state.length;

		// go ahead and map properties so can reuse valid properties without creating a closure reference.
		// Reusing properties allows for React components to do '===' to see if a property has changed.
		// if (prev) {
		// 	if (prev && prev[_mapped]) {
		// 		this.defineChildProperties(prev, true);
		// 	} else if (prev && Object.keys(prev[_impls]).length) {
		// 		this.automountChildren(prev);
		// 	}

		// 	// Kill invalid() nodes that are still active
		// 	prev._killInvalidButActiveChildren();
		// }
	}

	/*
		Map properties so can reuse valid properties. Reusing properties allows for React components
		to do '===' to see if a property has changed.
	*/
	onReshadow(prev) {
		// Kill invalid() nodes that are still active
		prev._killInvalidButActiveChildren();
	}

	isMapped() {
		return this[_mapped];
	}

	addChildren(start, num) {
		this[_nextMapping] = this[_nextMapping] || [...this[_impls]];

		const mapping = this[_nextMapping];
		const blanks = [];
		var count = num;

		while(count--) blanks.push(null);

		// rename children after newly added blanks
		for (let i=start, len=mapping.length; i<len; i++) {
			let idx = i + num;
			let child = mapping[i];

			if (child) {
				child.updateName(idx);
			}
		}

		mapping.splice(start, 0, ...blanks)
	}

	/*
		Its possible for children to move when array items are inserted or removed in update actions.
	*/
	childMapping() {
		return this[_nextMapping] ?this[_nextMapping] :this[_impls];
	}

	moveChildren(start, deleteCount, addCount) {
		this.removeChildren(start, deleteCount);
		this.addChildren(start, addCount);
	}

	removeChildren(start, num) {
		this[_nextMapping] = this[_nextMapping] || [...this[_impls]];

		const mapping = this[_nextMapping];

		// prevent changes in removed children
		for (let i=0; i<num; i++) {
			let child = mapping[start+i];

			if (child) {
				child.blockFurtherUpdates(true);
			}
		}

		// remove children from mapping
		mapping.splice(start, num);

		// rename remaining children
		for (let i=start, len=mapping.length; i<len; i++) {
			let child = mapping[i];

			if (child) {
				child.updateName(i);
			}
		}
	}

	toJSON() {
		return {
			...super.toJSON(),
			type: 'ArrayImpl',
			length: this.length,
			mapped: this[_mapped],
		};
	}


	//------------------------------------------------------------------------------------------------------
	//	Methods for access and manipulate subproperties - based on Array methods
	//------------------------------------------------------------------------------------------------------

	get length() {
		return this[_length];
	}

	/*
		Removes all subproperties.
	*/
	clear() {
		this.assign([], "clear()");
	}

	childAt(idx) {
		return this[_impls][i];
	}

	// This method does not change this object's state.
	concat(...values) {
		return flatten(this.values(), values);
	}

	pop() {
		var result;

		this.update( state => {
				const lastIdx = state.length - 1;

				state = [...state];
				result = state.pop();

				if (lastIdx != -1) {
					this.removeChildren(lastIdx, 1);
				}

				return { name: "pop()", nextState: state };
			});

		// value is no longer being managed so ok to return without cloning
		return result;
	}

	push(...values) {
		var result;

		modelizeArray(values);

		this.update( state => {
				state = [...state];
				result = state.push(...values);

				// no need to update children mapping only affecting tail

				return { name: "push()", nextState: state };
			});

		return result;
	}

	remove(idx) {
		var result;

		this.update( state => {
			state = [...state];
			result = state.splice(idx, 1);

			this.removeChildren(idx, 1);

			return { name: `remove(${idx})`, nextState: state }
		});

		// value is no longer being managed so ok to return without cloning
		return result[0];
	}

	shift() {
		var result;

		this.update( state => {
				state = [...state];
				result = state.shift();

				this.removeChildren(0, 1);

				return { name: "shift()", nextState: state };
			});

		// value is no longer being managed so ok to return without cloning
		return result;
	}

	splice(start, deleteCount, ...newItems) {
		var result;

		modelizeArray(newItems);

		this.update( state => {
				state = [...state];

				result = state.splice(start, deleteCount, ...newItems);
				this.moveChildren(start, deleteCount, newItems.length);

				return { name: `splice(${start}, ${deleteCount}, ...)`, nextState: state };
			});

		// values is no longer being managed so ok to return without cloning
		return result;
	}

	unshift(...values) {
		var result;

		modelizeArray(values);

		this.update( state => {
				state = [...state];
				result = state.unshift(...values);

				this.addChildren(0, values.length);

				return { name: "unshift()", nextState: state };
			});

		// values are no longer being managed so ok to return without cloning
		return result;
	}

	values() {
		return [ ...this[_impls] ];
	}


	//------------------------------------------------------------------------------------------------------
	//	Methods that must be implemented by subclasses
	//------------------------------------------------------------------------------------------------------

	defaults(newItems) {
		if (!Array.isArray(newItems)) {
			// nothing to do
			return;
		}

		const impls = this.childMapping();
		var child, value;

		for (let i=0, len=newItems.length; i<len; i++) {
			child = impls[i];
			value = newItems[i];

			if (child) {
				child.defaults(value);
			} else {
				this.update( state => {
						state = [...state];

						state.splice(i, 0, value);
						this.addChildren(i, newItems.length);

						return { nextState: state };
					});
			}
		}
	}

	merge(newItems) {
		// original algorithm (commented out below) is adding duplicates where in most
		// cases what is really wanted is one of two things:
		//    1) add if no duplicate (exact deep compare)
		//    2) merge if object's 'ID' is matched and add otherwise
		//
		// So probably need multiple algorithms driven by a property setting. Would need to worry
		// about ordering, inserts, deletions,...
		//
		// In the meantime just going to do a full replace
		return this.assign(newItems);

		// Original algorithm (broken)
		// if (!Array.isArray(newItems)) {
		// 	return this.assign(newItems);
		// }

		// const impls = this.childMapping();
		// var child, value;

		// for (let i=0, len=newItems.length; i<len; i++) {
		// 	child = impls[i];
		// 	value = newItems[i];

		// 	if (child) {
		// 		child.merge(value);
		// 	} else {
		// 		this.update( state => {
		// 				state = [...state];

		// 				state.splice(i, 0, value);
		// 				this.addChildren(i, newItems.length);

		// 				return { nextState: state };
		// 			});
		// 	}
		// }
	}


	//------------------------------------------------------------------------------------------------------
	//	Methods that subclasses with children must implement
	//------------------------------------------------------------------------------------------------------

	automountChildren(prev) {
		if (this[_mapped] || this[_automounted]) { return }

		this[_automounted] = true;

		const state = this.state();
		const shader = this.shader(state);

		for (let i=0, len=state.length; i<len; i++) {
			if (shader.isAutomount(i)) {
				this.defineChildProperty(i, shader, state, prev, true);
			}
		}
	}

	/*
		Subclasses should implement this method in such a way as not to trigger a mapping.
	*/
	childCount() {
		return this[_length];
	}

	/*
		Gets the implementation objects managed by this property.
	*/
	children() {
		return [ ...this[_impls] ];
	}

	getChild(idx) {
		return this.childAt(idx);
	}

	/*
		Gets the keys/indices for this property.

		Implementation note: Subclasses should implement this method in such a way as not to trigger a mapping.
	*/
	keys() {
		if (!this._keys) {
			this._keys = range(this.length);
		}

		return this._keys;
	}

	/*
		Maps all child properties onto this property using Object.defineProperty().
	*/
	defineChildProperties(prev, inCtor) {
		if (this[_mapped]) { return }

		this[_mapped] = true;

		const shader = this.shader(state);
		const state = this.state();
		var elementShader;

		for (let i=0, len=state.length; i<len; i++) {
			elementShader = shader.shaderFor(i, state);

			this.defineChildProperty(i, elementShader, state, prev, inCtor);
		}

		if (state) {
			shader.shadowUndefinedProperties(state, this, (name, shader) => {
					this.defineChildProperty(name, shader, state, prev, inCtor);
				});
		}
	}

	defineChildProperty(idx, elementShader, state, prev, inCtor=false) {
		// ensure not already defined
		if (this[_impls][idx]) { return }

		const prevMapping = prev && prev.childMapping();
		const prevChild = prevMapping && prevMapping[idx];
		var child;

		if (prevChild) {
			prevChild.switchName();

			child = reshadow(this.time(), state, prevChild, this);
		} else {
			child = elementShader.shadowProperty(this.time(), idx, state, this, this.store());
		}

		if (child) {
			this[_impls][idx] = child;

			if (!prevChild && !inCtor) {
				child.didShadow(this.time());
			}
		}
	}

	_killInvalidButActiveChildren() {
		// kill any unvisited children
			const children = this.children();
			var child;

			for (let i=0, len=children.length; i<len; i++) {
				child = children[i];

				if (!child.isValid() && child.isActive()) {
					child.obsoleteTree();
				}
			}
	}
}

