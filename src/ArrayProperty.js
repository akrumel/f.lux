
import ArrayShadow from "./ArrayShadow";
import IndexedProperty from "./IndexedProperty";
import StateType from "./StateType";


export default class ArrayProperty extends IndexedProperty {
	constructor(initialState=[], autoShadow=true, readonly) {
		super(initialState, autoShadow, readonly);
	}

	//------------------------------------------------------------------------------------------------------
	// Subclasses may want to override success methods
	//------------------------------------------------------------------------------------------------------

	shadowClass() {
		return StateType.shadowClassForProperty(this, ArrayShadow);
	}
}