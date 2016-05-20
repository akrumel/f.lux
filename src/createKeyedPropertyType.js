import KeyedProperty from "./KeyedProperty";
import Shadow from "./Shadow";
import StateTypes from "./StateTypes";


/*
	Creates an KeyedProperty subclass based on a custom Shadow type.
*/
export default function createKeyedPropertyType(shadowType={}, stateSpec, specCallback) {
	var ShadowClass;

	// get the shadow class
	if (shadowType instanceof Shadow) {
		// shadow class passed into method
		ShadowClass = shadowType
	} else {
		class CustomKeyedShadow extends Shadow { }

		var proto = CustomKeyedShadow.prototype;
		var names = Object.getOwnPropertyNames(shadowType);
		var name, desc;

		for (let i=0, len=names.length; i<len; i++) {
			name = names[i];
			desc = Object.getOwnPropertyDescriptor(shadowType, name);

			Object.defineProperty(proto, name, desc);
		}

		ShadowClass = CustomKeyedShadow;
	}

	// create the property subclass
	class CustomKeyedProperty extends KeyedProperty {
		shadowClass() {
			return ShadowClass;
		}
	}

	// assign state spec if present to new Property subclass
	CustomKeyedProperty.stateSpec = stateSpec || StateTypes.property(CustomKeyedProperty);

	if (specCallback) {
		specCallback(CustomKeyedProperty.stateSpec)
	}

	return CustomKeyedProperty;
}
