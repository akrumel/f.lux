import moment from "moment";

import {
	CollectionProperty,
	CollectionShadow,
} from "f.lux/lib/collection";

import TodoProperty from "./TodoProperty";


/*
	The shadow interface definition for the TodoCollection property. get/set style properties
	and methods defined in this definition will be added to the default CollectionShadow type.

	This shadow definition defines:
		* incompleteSize - getter property providing the number of incomplete todos.
		* addTodo(desc) - adds a TodoProperty to the TodoCollection. It set the time created
			to the initial todo state.

	This shadow definition could use the subclass technique as shown below. The trick is you
	have to remember/know the property parent class. Just depends on your preference.

		class TodoCollectionShadow extends CollectionShadow {
			...
		}

	Example usage:

		const { todos } = store.shadow;

		console.log("Number of todos", todos.size);
		console.log("Number incomplete todos", todos.incompleteSize);

		todos.addTodo("Do something unexpected today");

		store.udpateNow();  // synchronously update store state and reshadow as needed

		// shadow objects are immutable so need to get the new todos collection
		const { todos: currTodos } = store.shadow;

		console.log("New number of incomplete todos", currTodos.incompleteSize)
*/
const TodoCollectionShadow = {
	get incompleteSize() {
		return this.reduce( (acc, t) => !t.completed ?acc+1 :acc, 0)
	},

	addTodo(desc) {
		return this.create({ desc, created: moment().toISOString() })
	}
}


/*
	This app does not need to tie into the property life-cycle for the TodoCollection so it is
	defined using just a custom shadow. The CollectionProperty class defines a static helper
	function for creating a custom CollectionProperty class with having to directly subclass. The
	'spec' passed to the callback is a StateType instance that will be assigned to the new
	property class 'type' class variable.

	Noteworthy features:
		* CollectionProperty.createClass(shadowDefnOrClass, specCallback)
			Each built-in property class provides a createClass() function for transforming a
			shadow definition into a functional property class.
		* spec.managedType(type) - the collection will use the StateType instance passed into
			the method for shadowing each model managed by the collection.
*/
export default CollectionProperty.createClass(TodoCollectionShadow, spec => {
	spec.managedType(TodoProperty.type)  // each model contained will be a TodoProperty type
		.typeName("TodoCollection")      // useful for diagnostics
});