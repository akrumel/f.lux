import { IndexedProperty } from "f.lux";

import TodoProperty from "./TodoProperty";


/*
	The shadow interface definition for the TodoListProperty property represented as a
	specialized array. get/set style properties and methods defined in this definition will
	be added to the default ArrayShadow type.

	This shadow definition defines:
		* incompleteSize - getter property providing the number of incomplete todos.
		* addTodo(desc) - adds a TodoProperty to the TodoCollection. It set the time created
			to the initial todo state.
		* removeTodo(todo) - removes a TodoProperty from the array.

	This shadow definition could use the subclass technique as shown below. The trick is you
	have to remember/know the property parent class. Just depends on your preference.

		class TodoCollectionShadow extends ArrayShadow {
			...
		}
*/
const TodoListShadow = {
	get incompleteSize() {
		return this.reduce( (acc, t) => !t.completed ?acc+1 :acc, 0);
	},

	addTodo(desc) {
		const listProp = this.$$();

		listProp._indexed.push(TodoProperty.create(desc));
	},

	removeTodo(todo) {
		const listProp = this.$$();
		const idx = this.indexOf(todo);

		if (idx !== -1) {
			listProp._indexed.remove(idx);
		}
	}
}


/*
	This app does not need to tie into the property life-cycle for the TodoListProperty so it is
	defined using just a custom shadow. The ArrayProperty class defines a static helper
	function for creating a custom ArrayProperty class with having to directly subclass. The
	'type' passed to the callback is a StateType instance that will be assigned to the new
	property class 'type' class variable.

	Noteworthy features:
		* IndexedProperty.createClass(shadowDefnOrClass, typeCallback)
			Each built-in property class provides a createClass() function for transforming a
			shadow definition into a functional property class.
		* type.elementType(type) - the array will use the StateType instance passed into
			the method for shadowing each model contained in the array.
*/
export default IndexedProperty.createClass(TodoListShadow, type => {
	type.elementType(TodoProperty.type)    // each model contained will be a TodoProperty type
		.typeName("TodoListProperty")      // useful for diagnostics
});