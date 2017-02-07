import { isObject } from "akutils";

/**
	Function used by shaders to instantiate shadow implementation classes, subclasses of ShadowImpl.

	@ignore
*/
export default function shadowProperty(time, ImplClass, property, name, state, parent, shader) {
	const impl = new ImplClass(time, property, name, state, parent, shader);

	// set the current implementation
	property.setImpl(impl);

	// invoke will shadow life-cycle method
	property.onPropertyWillShadow();

	impl.setupPropertyAccess();

	return impl;
}
