import createPropertyClass from "./createPropertyClass";
import IndexedShadow from "./IndexedShadow";
import IndexedShadowImpl from "./IndexedShadowImpl";
import MapProperty from "./MapProperty";
import Property from "./Property";
import PropertyFactoryShader from "./PropertyFactoryShader";
import StateType from "./StateType";


const _propertyShader = Symbol('propertyClass');

export default class IndexedProperty extends Property {
	constructor(stateType) {
		super(stateType);

		this.setImplementationClass(IndexedShadowImpl);
		this.setShadowClass(IndexedShadow);
	}

	/*
		Factory function for creating an IndexedProperty subclass suitable for using with new.

		Parameters (all are optional):
			shadowType: one of a pojo or class. This parameter defines the new property
				shadow. If pojo specified, each property and function is mapped onto a Shadow subclass.
			specCallback: a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow, initial state, or readonly.
			initialState: the initial state for the new property. (default is [])
	*/
	static createClass(shadowType={}, specCallback, initialState=[]) {
		return createPropertyClass(shadowType, initialState, specCallback, IndexedProperty, IndexedShadow);
	}

	clearValueShader() {
		this.shader().setElementShader(null);
	}

	setElementShader(stateType) {
		const shader = new PropertyFactoryShader(stateType, this);

		this.shader().setElementShader(shader);
	}


	//------------------------------------------------------------------------------------------------------
	// State lifecycle methods
	//------------------------------------------------------------------------------------------------------

	getInitialState(state) {
		if (this.initialState()) {
			const initState = [ ...this.initialState() ];

			if (state && Array.isArray(state)) {
				for (let i=0, len=state.length; i<len; i++) {
					initState[i] = state[i];
				}
			}

			return initState;
		}

		return state;
	}


	//------------------------------------------------------------------------------------------------------
	// Array and other child manipulation functions
	//------------------------------------------------------------------------------------------------------

	get length() {
		return this.__().length;
	}

	// Select Array methods (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
	clear() {
		if (this.isActive()) {
			this.__().clear();
		}
	}

	concat(...values) {
		if (this.isActive()) {
			return this.__().concat(...values);
		}
	}

	pop() {
		if (this.isActive()) {
			return this.__().pop();
		}
	}

	push(...values) {
		if (this.isActive()) {
			return this.__().push(...values);
		}
	}

	remove(idx) {
		if (this.isActive()) {
			return this.__().remove(idx);
		}
	}

	shift() {
		if (this.isActive()) {
			return this.__().shift();
		}
	}

	splice(start, deleteCount, ...newItems) {
		if (this.isActive()) {
			return this.__().splice(start, deleteCount, ...newItems);
		}
	}

	unshift(...values) {
		if (this.isActive()) {
			return this.__().unshift(...values);
		}
	}
}


StateType.defineType(IndexedProperty, spec => {
	spec.initialState([])
		.elementType(MapProperty.type);
});
