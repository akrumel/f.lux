
import IndexedShadow from "./IndexedShadow";
import IndexedShadowImpl from "./IndexedShadowImpl";
import Property from "./Property";
import PropertyFactoryShader from "./PropertyFactoryShader";
import StateType from "./StateType";


const _propertyShader = Symbol('propertyClass');

export default class IndexedProperty extends Property {
	constructor(initialState=[], autoShadow, readonly) {
		super(initialState, autoShadow, readonly);
	}

	clearValueShader() {
		this.shader().setElementShader(null);
	}

	setValueShader(propertyClass, initialState, autoShadow, readonly=false) {
		const shader = new PropertyFactoryShader(propertyClass, this, initialState, autoShadow, readonly);

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
	// Subclasses may want to override success methods
	//------------------------------------------------------------------------------------------------------

	implementationClass() {
		return IndexedShadowImpl;
	}

	shadowClass() {
		return StateType.shadowClassForProperty(this, IndexedShadow);
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


Object.defineProperty(IndexedProperty, "type", {
		get: () => new StateType(IndexedProperty)
	})
