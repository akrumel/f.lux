import moment from "moment";

import {
	ObjectProperty,
	PrimitiveProperty,
	Shadow,
} from "f.lux";


/*
	The TodoCollection uses the TodoProperty to present each contained model.

	Unlike defining the TodosCollectionShadow, the TodoShadow is defined using the subclassing technique.
	The technique is based solely on your preference. Personally, I prefer subclassing because the shadow
	type is easier to determine when working in the javascript console.

	Each todo exposes a single method
		* momentCreated() - returns a 'moment' instance representing the todo creation date.

	If you would prefer momentCreated() to be a getter property it could be defined using the es2016
	get keyword:

		get momentCreated() { return moment(this.created) }

	Note: the Shadow class is the default shadow class used by ObjectProperty and does not expose
		any properties or methods so it is a blank slate. Well, that statement is not strictly true
		since all shdowed state values have _(), $(), $$(), toJSON(), and toString() but you get
		the point.
*/
class TodoShadow extends Shadow {
	momentCreated() {
		return moment(this.created);
	}
}


/*
	The actual property class is an ObjectProperty subclass created using the createClass() helper
	function. Each built-in Property class defines a createClass() method to save you from having
	to implement a bunch of boilerplate code when you don't need the power of explicitly defining
	your own f.lux types.

	Each todo item will have four shadow properties with specific characteristics:
		 * id - the object id assigned by the server/endpoint on save. The shadowing description
		 	marks this as readonly which prevents bad app code from changing it (would be bad)
		 * completed - boolean flag indicating the todo is, well, completed. Notice it is provided
		 	an initial value of 'false'.
		 * created - another readonly value delaring the todo creation time. See the
		 	TodoCollectionShadow.addTodo(desc) method for where this is established. It is stored
		 	as an ISO data string.
		 * desc - the actual todo text description which is read/write since not explicitly set
		 	to readonly

	The PrimitiveProperty will allow any javasript type that is designed for all javasript types
	that are not an object or array. There are facilities to specialize a PrimitiveProperty to
	support specific values, such as boolean, string matching a regexp, some custom enum type,
	a moment representation of a data string,...
*/
export default ObjectProperty.createClass(TodoShadow, spec => {
	spec.properties({
				completed: PrimitiveProperty.type.initialState(false),
				created: PrimitiveProperty.type.readonly,
				desc: PrimitiveProperty.type,
			})
		.autoshadowOff
		.readonlyOff
		.typeName("TodoProperty");
})
