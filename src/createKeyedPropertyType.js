import KeyedProperty from "./KeyedProperty";
import Shadow from "./Shadow";
import StateType from "./StateType";


/*
	Creates an KeyedProperty subclass based on a custom Shadow type.
*/
export default function createKeyedPropertyType(shadowType={}, stateSpec, specCallback) {
	var ShadowClass;

	// get the shadow class
	if (typeof shadowType === 'function') {
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
		constructor(
				initialState=CustomKeyedProperty.stateSpec._initialState,
				autoShadow=CustomKeyedProperty.stateSpec._autoshadow,
				readonly=CustomKeyedProperty.stateSpec._readonly)
		{
			super(initialState, autoShadow, readonly);

			this.setShadowClass(ShadowClass);
		}
	}

	// assign state spec if present to new Property subclass
	CustomKeyedProperty.stateSpec = stateSpec || new StateType(CustomKeyedProperty);

	if (specCallback) {
		specCallback(CustomKeyedProperty.stateSpec)
	}

	return CustomKeyedProperty;
}
