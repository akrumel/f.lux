import { isObject } from "akutils";

/*
	Function used by shaders to instantiate shadow implementation classes, subclasses of ShadowImpl.
*/
export default function shadowProperty(time, ImplClass, property, name, state, parent, shader, prev) {
	const impl = new ImplClass(time, property, name, state, parent, shader, prev);

	if (property.readonly) {
		impl.setReadonly(true);
	}

	impl.setupPropertyAccess();

	return impl;
}
