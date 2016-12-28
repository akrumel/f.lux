import moment from "moment";

import {
	ObjectProperty,
	StateType,
} from "f.lux";

import {
	PojoEndpointProperty
} from "f.lux/lib/collection";

import TodoCollection from "./TodoCollection";



export default class TodoRootProperty extends ObjectProperty {
	constructor() {
		super(TodoRootProperty.type);
	}

	propertyDidShadow() {
		const { todos } = this._();
		const todoEp = new PojoEndpointProperty({
			1: { id: 1, desc: "Do something", completed: false, created: moment().subtract(1, 'days').toISOString() }
		})

		todos.setEndpoint(todoEp);
	}
}


StateType.defineType(TodoRootProperty, spec => {
	spec.initialState({})
		.properties({
					todos: TodoCollection.type,
				})
		.typeName("TodoRootProperty");
});


