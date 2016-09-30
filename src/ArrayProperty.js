
import ArrayShadow from "./ArrayShadow";
import IndexedProperty from "./IndexedProperty";


export default class ArrayProperty extends IndexedProperty {
	constructor(initialState=[], autoShadow=true, readonly) {
		super(initialState, autoShadow, readonly);
	}

	//------------------------------------------------------------------------------------------------------
	// Subclasses may want to override success methods
	//------------------------------------------------------------------------------------------------------

	shadowClass() {
		const { StateType } = require("./StateTypes");

		return StateType.shadowClassForProperty(this, ArrayShadow);
	}
}