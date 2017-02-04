import moment from "moment";

import { ObjectProperty } from "f.lux";

import TodoListProperty from "./TodoListProperty";
import UiProperty from "./UiProperty";


/*
	Root property for the store. The root has two child properties:
		- todos: list of todo items
		- ui: contains UI state
*/
export default ObjectProperty.createClass({}, type => {
	type.autoshadowOff                          // do not shadow state values without explicit sub-property definitions
		.properties({
				todos: TodoListProperty.type.readonly,
				ui: UiProperty.type,
			})
		.readonly                               // prevent application code from reassigning the 'todos' collection (paranoia)
		.typeName("TodoRootProperty");          // useful for certain diagnostic situations
});


