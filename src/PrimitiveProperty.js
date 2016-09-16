import { isPrimitive } from "akutils";
import cloneDeep from "lodash.clonedeep";

import PrimitiveShadowImpl from "./PrimitiveShadowImpl";
import PrimitiveShadow from "./PrimitiveShadowImpl";
import Property from "./Property";



export default class PrimitiveProperty extends Property {
	constructor(initialState, autoShadow=true, readonly=false) {
		super(initialState, autoShadow, readonly);
	}

	//------------------------------------------------------------------------------------------------------
	// PrimitiveProperty subclasses may want to override thise methods
	//------------------------------------------------------------------------------------------------------

	/*
		Invoked by PrimitiveShadowImpl::definePropertyGetValue() to get the value to return when this property
		is accessed through the parent property's shadow. Subclasses can override this method to convert
		the raw state value to another form (Date, URL, enumeration) or contrain it in some way (min/max,
		uppercase, regular expression).

		Note: Ensure mutations to the value returned will not affect the state parameter passed into the
		 	method as the state paremeter is contained in the store's state value.

		Parameters
			state - the raw state value (not a shadow)

		Returns - this base implementation returns the state parameter if it is a primitive and a deep clone
			otherwise
	*/
	definePropertyGetValue(state) {
		return isPrimitive(state) ?state :cloneDeep(state);
	}

	definePropertySetValue(newValue) {
		this.__.assign(newValue);
	}


	//------------------------------------------------------------------------------------------------------
	// Property subclasses may want to override thise methods
	//------------------------------------------------------------------------------------------------------

	implementationClass() {
		return PrimitiveShadowImpl;
	}

	shadowClass() {
		const { StateType } = require("./StateTypes");

		return StateType.shadowClassForProperty(this, PrimitiveShadow);
	}

}