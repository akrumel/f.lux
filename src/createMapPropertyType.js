import MapProperty from "./MapProperty";
import MapShadow from "./MapShadow";
import StateTypes from "./StateTypes";


/*
	Creates an ArrayProperty subclass based on a custom Shadow type.
*/
export default function createMapPropertyType(shadowType={}, stateSpec, specCallback) {
	var ShadowClass;

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

	// create the property subclass
	class CustomMapProperty extends MapProperty {
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
