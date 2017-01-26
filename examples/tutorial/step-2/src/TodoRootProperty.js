import moment from "moment";

import { ObjectProperty } from "f.lux";

import TodoListProperty from "./TodoListProperty";


/*
	Root property for the store. In this simple app the root has a single sub-property of type
	TodoListProperty. The ObjectProperty.createClass() function will create an ObjectProperty
	subclass and setup the f.lux 'type' class property without requiring the direct use of subclassing.

	This process is analogous to React's propTypes setup.
*/
export default ObjectProperty.createClass({}, spec => {
	spec.autoshadowOff                          // do not shadow state values without explicit sub-property definitions
		.properties({                           // define sub-properties (just one in this case)
				todos: TodoListProperty.type,   // 'todos' is a collection property
			})
		.readonly                               // prevent application code from reassigning the 'todos' collection (paranoia)
		.typeName("TodoRootProperty");          // useful for certain diagnostic situations
});


