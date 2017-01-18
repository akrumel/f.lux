import { assert } from "akutils";

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

	/*
		Factory function for creating a StateType with an appropriately set intial state.

		Parameters:
			PropClass: MapProperty subclass (required)
			ShadowClass: MapShadow subclass (optional)
			specCallback: a callback function that will be passed the StateType spec for additional
				customization, such as setting autoshadow or readonly. (optional)
			initialState: the initial state for the new property. (default is {})
	*/
	static defineType(PropClass, ShadowType, specCallback, initialState={}) {
		assert( a => a.is(MapProperty.isPrototypeOf(PropClass), "PropClass must subclass MapProperty") );

		return StateType.defineTypeEx(PropClass, ShadowType, specCallback, initialState);
	}
}


StateType.defineType(MapProperty, spec => spec.initialState({}).typeName("MapProperty") );
