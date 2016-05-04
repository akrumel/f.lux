import {
	createIndexedPropertyType,
	StateTypes
} from "f.lux";


/*
	The shadow literal defines methods and computed properties (es2015 get/set) that will be exposed
	on the shadow property. This technique removes the need to inherit from a specific Shadow class.

	The actual property and shadow types will be created by the createIndexedPropertyType() function
	below.
*/
export const CounterLog = {
	addAction(action, time) {
		this.$$.push({
				action: action,
				time: time
			});
	},
}

/*
	Each log entry will be a KeyedProperty, which means no API is exposed
	to extend the entry. Each element will be readonly.
*/
export const elementSpec = StateTypes
	.keyed({
			action: StateTypes.Primitive,
			time: StateTypes.Primitive
		})
	.readonly;

// create the property type as an IndexedProperty subclass. The StateSpec created by createIndexedPropertyType()
// is extended to specify an initial state, which ensures the log is created as soon as the parent property
// is shadowed.
const CounterLogProperty = createIndexedPropertyType(CounterLog, elementSpec, spec => spec.initialState([]) );

export default CounterLogProperty;
