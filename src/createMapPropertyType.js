import MapProperty from "./MapProperty";
import MapShadow from "./MapShadow";
import StateTypes from "./StateTypes";


var deprecatedWarningShown = false;

/*
	Deprecated - Use MapProperty.createClass().
*/
export default function createMapPropertyType(shadowType={}, stateSpec, specCallback) {
	var ShadowClass;

	if (!deprecatedWarningShown) {
		console.warn("createMapPropertyType() deprecated and will be removed soon - use MapProperty.createClass()");
		deprecatedWarningShown = true;
	}

	// get the shadow class
	if (shadowType instanceof MapShadow) {
		// shadow class passed into method
		ShadowClass = shadowType
	} else {
		class CustomMapShadow extends MapShadow { }

		var proto = CustomMapShadow.prototype;
		var names = Object.getOwnPropertyNames(shadowType);
		var name, desc;

		for (let i=0, len=names.length; i<len; i++) {
			name = names[i];
			desc = Object.getOwnPropertyDescriptor(shadowType, name);

			Object.defineProperty(proto, name, desc);
		}

		ShadowClass = CustomMapShadow;
	}

	// default spec for constructor
	var spec = stateSpec || {};

	// create the property subclass
	class CustomMapProperty extends MapProperty {
		constructor(initialState=spec._initialState, autoShadow=spec._autoshadow, readonly=spec._readonly) {
			super(initialState, autoShadow, readonly);
		}

		shadowClass() {
			return ShadowClass;
		}
	}

	// assign state spec if present to new Property subclass
	CustomMapProperty.stateSpec = stateSpec || StateTypes.property(CustomMapProperty);

	if (specCallback) {
		specCallback(CustomMapProperty.stateSpec)
	}

	return CustomMapProperty;
}
