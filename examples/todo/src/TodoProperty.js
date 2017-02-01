import moment from "moment";

import {
	ObjectProperty,
	PrimitiveProperty,
	Shadow,
} from "f.lux";


/*
	Property for a Todo item.
*/
export default class TodoProperty extends ObjectProperty {
	/*
		Life-cycle function called when a child property is going to change. Use this hook to
		set the 'updated' property with the time that 'completed' or 'desc' change.
	*/
	propertyChildInvalidated(childProperty, sourceProperty) {
		const childName = childProperty.name();

		if (childName === "completed" || childName === "desc") {
			// _keyed is defined in ObjectProperty and provides a non-shadowed api for working with
			// child properties. We use the api to 'set' a readonly property value
			this._keyed.set("updated", moment().toISOString());
		}
	}

	/*
		Helper function for creating the state for a new todo item. Any todo data structure changes
		can be made all in this one file for easy maintenance.
	*/
	static create(desc) {
		const now = moment().toISOString();

		return {
			completed: false,
			created: now,
			desc: desc,
			updated: now,
		}
	}
}


/*
	Unlike defining the TodoListProperty, the TodoShadow is defined using the subclassing technique.
	The technique to use is based solely on your preference. Personally, I prefer subclassing because
	the shadow type is easier to determine when working in the javascript console.

	Each todo exposes computed properties 'mementCreated' and 'momentUpdated' that compute a moment
	object using the 'created' and 'udpated' properties. A computed property is one that uses es2015
	'get' syntax to define a function that is treated like a property when a property is accessed.

	Note: Shadow is the default shadow class used by ObjectProperty and does not expose
		any properties or methods so it is a blank slate. Well, that statement is not strictly true
		since all shdowed state values have _(), $(), $$(), toJSON(), and toString() but you get
		the point.
*/
class TodoShadow extends Shadow {
	get momentCreated() {
		return moment(this.created);
	}

	get momentUpdated() {
		return moment(this.updated);
	}

}


/*
	Each todo item will have four shadow properties with specific characteristics:
		* completed - boolean flag indicating the todo is, well, completed. Notice it is provided
		 	an initial value of 'false'.
		* created - readonly value declaring the todo creation time stored as an ISO data string.
		* desc - the actual todo text description which is read/write since not explicitly set
		 	to readonly.
		* updated - readonly ISO data string for time of last data change.

	The PrimitiveProperty will allow any javasript type that is designed for all javasript types
	that are not an object or array. There are facilities to specialize a PrimitiveProperty to
	support specific values, such as boolean, string matching a regexp, some custom enum type,
	a moment representation of a data string,...
*/
ObjectProperty.defineType(TodoProperty, TodoShadow, type => {
	type.properties({
				completed: PrimitiveProperty.type.initialState(false),
				created: PrimitiveProperty.type.readonly,
				desc: PrimitiveProperty.type,
				updated: PrimitiveProperty.type.readonly,
			})
		.readonlyOff                 // enable 'completed' and 'desc' assignment
		.typeName("TodoProperty");
});


