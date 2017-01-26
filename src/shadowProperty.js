import { isObject } from "akutils";

/*
	Function used by shaders to instantiate shadow implementation classes, subclasses of ShadowImpl.
*/
export default function shadowProperty(time, ImplClass, property, name, state, parent, shader) {
	const impl = new ImplClass(time, property, name, state, parent, shader);

	if (property.isReadonly()) {
		impl.setReadonly(true);
	}

	// set the current implementation
	property.setImpl(impl);

	// invoke will shadow life-cycle method
	property.onPropertyWillShadow();

	impl.setupPropertyAccess();

	return impl;
}
