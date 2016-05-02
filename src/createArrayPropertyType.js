import ArrayProperty from "./ArrayProperty";
import ArrayShadow from "./ArrayShadow";


/*
	Creates an ArrayProperty subclass based on a custom Shadow type.
*/
export default function createArrayPropertyType(shadowType, stateSpec) {
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

			if (name !== "__stateSpec__") {
				Object.defineProperty(proto, name, desc);
			} else {
				// embedded stateSpec
				CustomArrayShadow.stateSpec = shadowType.__stateSpec__ || shadowType.stateSpec;
			}
		}

		ShadowClass = CustomArrayShadow;
	}

	// create the property subclass
	class CustomArrayProperty extends ArrayProperty {
		constructor(defaults, autoShadow, readonly) {
			super(defaults, autoShadow, readonly);
		}

		shadowClass() {
			return ShadowClass;
		}
	}

	// assign state spec if present to new Property subclass
	CustomArrayProperty.stateSpec = ShadowClass.stateSpec || stateSpec;

	return CustomArrayProperty;
}
