import isObject from "./utils/isObject";

/*
	Function used by shaders to instantiate shadow implementation classes, subclasses of ShadowImpl.
*/
export default function shadowProperty(time, ImplClass, property, ...args) {
	const impl = new ImplClass(time, property, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);

	if (property.readonly) {
		impl.setReadonly(true);
	}
	
	impl.setupPropertyAccess();

	return impl;
}
