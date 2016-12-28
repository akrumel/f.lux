import moment from "moment";

import {
	ObjectProperty,
	PrimitiveProperty,
	Shadow,
	StateType,
} from "f.lux";

import {
	CollectionProperty,
	CollectionShadow,
	PojoEndpointProperty
} from "f.lux/lib/collection";


const TodoCollectionShadow = {
	addTodo(desc) {
		return this.create({ desc, created: moment().toISOString() })
	}
}

class TodoShadow extends Shadow {
	momentCreated() {
		return moment(this.created);
	}
}

const TodoProperty = ObjectProperty.createClass(TodoShadow, spec => {
	spec.properties({
				completed: PrimitiveProperty.type.initialState(false),
				created: PrimitiveProperty.type.readonly,
				desc: PrimitiveProperty.type,
				id: PrimitiveProperty.type.readonly,
			})
		.autoshadowOff
		.typeName("TodoProperty");
})

export default CollectionProperty.createClass(TodoCollectionShadow, spec => {
	spec.managedType(TodoProperty.type)
		.typeName("TodoCollection")
})