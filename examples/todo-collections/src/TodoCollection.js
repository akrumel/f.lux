import moment from "moment";

import {
	CollectionProperty,
	CollectionShadow,
} from "f.lux/lib/collection";

import TodoProperty from "./TodoProperty";


const TodoCollectionShadow = {
	get incompleteSize() {
		return this.reduce( (acc, t) => !t.completed ?acc+1 :acc, 0)
	},

	addTodo(desc) {
		return this.create({ desc, created: moment().toISOString() })
	}
}


export default CollectionProperty.createClass(TodoCollectionShadow, spec => {
	spec.managedType(TodoProperty.type)
		.typeName("TodoCollection")
})