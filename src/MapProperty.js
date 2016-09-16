
import KeyedProperty from "./KeyedProperty";
import MapShadow from "./MapShadow";


/*
	Exposes a Map interface on a shadow property. The Map API is exposed throught in MapShadow, which uses
	the KeyedProperty methods for implementation.
*/
export default class MapProperty extends KeyedProperty {
	constructor(initialState, autoShadow, readonly) {
		super(initialState, autoShadow, readonly);
	}

	//------------------------------------------------------------------------------------------------------
	// Subclasses may want to override thise methods
	//------------------------------------------------------------------------------------------------------

	shadowClass() {
		const { StateType } = require("./StateTypes");

		return StateType.shadowClassForProperty(this, MapShadow);
	}
}