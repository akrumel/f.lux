import moment from "moment";

import {
	ObjectProperty,
	PrimitiveProperty,
	Shadow,
} from "f.lux";


class TodoShadow extends Shadow {
	momentCreated() {
		return moment(this.created);
	}
}

export default ObjectProperty.createClass(TodoShadow, spec => {
	spec.properties({
				completed: PrimitiveProperty.type.initialState(false),
				created: PrimitiveProperty.type.readonly,
				desc: PrimitiveProperty.type,
				id: PrimitiveProperty.type.readonly,
			})
		.autoshadowOff
		.typeName("TodoProperty");
})
