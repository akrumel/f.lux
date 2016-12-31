import Shadow from "./Shadow";
import StateType from "./StateType";


/*
	Factory function for creating an Property subclass suitable for using with new.

	Parameters (all are optional):
		shadowType: one of a pojo or a class. This parameter defines the new property's shadow
			type. If pojo specified, each property and function is mapped onto a subclass of the
			BaseShadowClass parameter. The BaseShadowClass parameter is ignored if this parameter
			is a class.
		stateType: a StateType instance defining the Property
		specCallback: a callback function that will be passed the StateType spec for additional
			customization, such as setting autoshadow, initial state, or readonly.
		PropertyClass: the base class for defining the property. Must be a Property subclass.
		BaseShadowClass: The base shadow class for when shadowType parameter is not a class/function
			(default is Shadow)
*/
export default function createPropertyClass(
	shadowType,
	initialState,
	specCallback,
	PropertyClass,
	BaseShadowClass=Shadow)
{
	var ShadowClass;

	// get the shadow class
	if (typeof shadowType === 'function') {
		// shadow class passed into method
		ShadowClass = shadowType;
	} else {
		class CustomShadow extends BaseShadowClass { }

		var proto = CustomShadow.prototype;
		var names = Object.getOwnPropertyNames(shadowType);
		var name, desc;

		for (let i=0, len=names.length; i<len; i++) {
			name = names[i];
			desc = Object.getOwnPropertyDescriptor(shadowType, name);

			Object.defineProperty(proto, name, desc);
		}

		ShadowClass = CustomShadow;
	}

	// create the property subclass
	class CustomProperty extends PropertyClass {
		constructor(stateType) {
			super(stateType);

			this.setShadowClass(ShadowClass);
		}
	}

	// create the type class variable
	StateType.defineType(CustomProperty, spec => {
			if (initialState !== undefined) {
				spec.initialState(initialState);
			}

			if (specCallback) {
				specCallback(spec, CustomProperty);
			}
		});

	return CustomProperty;
}

