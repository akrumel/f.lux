
import ObjectProperty from "./ObjectProperty";
import MapShadow from "./MapShadow";
import StateType from "./StateType";


/*
	Exposes a Map interface on a shadow property. The Map API is exposed through the MapShadow class, which uses
	the ObjectProperty methods for implementation.
*/
export default class MapProperty extends ObjectProperty {
	constructor(stateType) {
		super(stateType);

		this.setShadowClass(MapShadow)
	}

	/*
		Factory function for creating an MapProperty subclass suitable for using with new.

		Parameters (all are optional):
			shadowType - one of a pojo or class. This parameter defines the new property
				shadow. If pojo specified, each property and function is mapped onto a Shadow subclass.
			specCallback - a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow, initial state, or readonly.
			initialState: the initial state for the new property. (default is {})
	*/
	static createClass(shadowType={}, specCallback, initialState={}) {
		return createPropertyClass(shadowType, initialState, specCallback, MapProperty);
	}
}


StateType.defineType(MapProperty, spec => spec.initialState({}).typeName("MapProperty") );
