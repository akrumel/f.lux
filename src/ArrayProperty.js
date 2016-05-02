
import ArrayShadow from "./ArrayShadow";
import IndexedProperty from "./IndexedProperty";


export default class ArrayProperty extends IndexedProperty {
	constructor(initialState=[], autoShadow=true, readonly) {
		super(initialState, autoShadow, readonly);
	}

	//------------------------------------------------------------------------------------------------------
	// Subclasses may want to override thise methods
	//------------------------------------------------------------------------------------------------------

	shadowClass() {
		return ArrayShadow;
	}
}