import {
	IndexedProperty,
	IndexedShadow,
	ObjectProperty,
} from "f.lux";


/*
	The shadow literal defines methods and computed properties (es2015 get/set) that will be exposed
	on the shadow property. This technique removes the need to inherit from a specific Shadow class as
	required by the Property type. In this case, you would need to subclass IndexedShadow or the the
	state shadow would not have the expected methods and properties: length, map(), reduce(), find(),...

	The IndexedProperty.createClass() function will create an IndexedShadow subclass and add any
	methods and get/set properties defined in the POJO to the IndexedShadow subclass.

	The actual property and shadow classes are created by the IndexedProperty.createClass() function
	below.

	Alternatively, you could subclass IndexedShadow and pass that as first parameter to
	IndexedProperty.createClass().

		export class CounterLog extends IndexedShadow {
			addAction(action, time) { ... }
		}
*/
export const CounterLog = {
	addAction(action, time) {
		this.$$().push({
				action: action,
				time: time
			});
	}
}


/*
	Create an IndexedProperty subclass which is like an array sans mutable methods, like push() and pop().
	Log entries are adde using the shadow state method 'addAction()'. No api is exposed for removing log
	entries.

	Note: the ArrayProperty exposes the full javascript array api.
*/
export default IndexedProperty.createClass(CounterLog, null, spec => {
	spec.setElementClass(ObjectProperty)     // each element will be an ObjectProperty (default is MapProperty)
		.readonly                            // log and all elements will be readonly
		.typeName("CounterLogProperty");     // useful for debugging (no other use)
})

