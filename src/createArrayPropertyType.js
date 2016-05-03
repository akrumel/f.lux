import ArrayProperty from "./ArrayProperty";
import ArrayShadow from "./ArrayShadow";
import StateTypes from "./StateTypes";


/*
	Creates an ArrayProperty subclass based on a custom Shadow type.
*/
export default function createArrayPropertyType(shadowType={}, elementType, specCallback) {
	var ShadowClass;

	// get the shadow class
	if (shadowType instanceof ArrayShadow) {
		// shadow class passed into method
		ShadowClass = shadowType
	} else {
		class CustomArrayShadow extends ArrayShadow { }

		var proto = CustomArrayShadow.prototype;
		var names = Object.getOwnPropertyNames(shadowType);
		var name, desc;

		for (let i=0, len=names.length; i<len; i++) {
			name = names[i];
			desc = Object.getOwnPropertyDescriptor(shadowType, name);

			Object.defineProperty(proto, name, desc);
		}

		ShadowClass = CustomArrayShadow;
	}

	// create the property subclass
	class CustomArrayProperty extends ArrayProperty {
		shadowClass() {
			return ShadowClass;
		}
	}

	if (elementType) {
		// assign state spec if present to new Property subclass
		CustomArrayProperty.stateSpec = StateTypes.property(CustomArrayProperty)
				.setElementType(elementType);

		if (specCallback) {
			specCallback(CustomIndexedProperty.stateSpec)
		}
	}

	return CustomArrayProperty;
}
