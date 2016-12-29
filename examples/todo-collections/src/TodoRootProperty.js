import moment from "moment";
import uuid from "uuid";

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
			1: { id: 1, desc: "Dream big!", completed: true, created: moment().subtract(1, 'days').toISOString() },
			2: { id: 2, desc: "Don't let your dreams be dreams", completed: false, created: moment().toISOString() }
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


