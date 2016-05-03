import IndexedProperty from "./IndexedProperty";
import IndexedShadow from "./IndexedShadow";
import StateTypes from "./StateTypes";


/*
	Creates an ArrayProperty subclass based on a custom Shadow type.
*/
export default function createIndexedPropertyType(shadowType, elementType, autoshadow, readonly) {
	var ShadowClass;

	// get the shadow class
	if (shadowType instanceof IndexedShadow) {
		// shadow class passed into method
		ShadowClass = shadowType
	} else {
		class CustomIndexedShadow extends IndexedShadow { }

		var proto = CustomIndexedShadow.prototype;
		var names = Object.getOwnPropertyNames(shadowType);
		var name, desc;

		for (let i=0, len=names.length; i<len; i++) {
			name = names[i];
			desc = Object.getOwnPropertyDescriptor(shadowType, name);

			Object.defineProperty(proto, name, desc);
		}

		ShadowClass = CustomIndexedShadow;
	}

	// create the property subclass
	class CustomIndexedProperty extends IndexedProperty {
		shadowClass() {
			return ShadowClass;
		}
	}

	if (elementType) {
		// assign state spec if present to new Property subclass
		CustomIndexedProperty.stateSpec = StateTypes.property(CustomIndexedProperty)
				.setElementType(elementType);

		autoshadow && CustomIndexedProperty.stateSpec.autoshadow;
		readonly && CustomIndexedProperty.stateSpec.readonly;
	}

	return CustomIndexedProperty;
}
