import isPlainObject from "lodash.isplainobject";


export default function shadowPropertyHelper(target, name, descriptor, bindProperty=false) {
	if (isPlainObject(target)) {
		// mixin method
		if (!target.__shadowDescriptors__) {
			target.__shadowDescriptors__ = {};
		}

		addDescriptor(target.__shadowDescriptors__, name, descriptor, bindProperty);
	} else {
		// Property subclass method
		const ctor = target.constructor;

		if (!ctor.shadowDescriptors) {
			ctor.shadowDescriptors = {};
		}

		addDescriptor(ctor.shadowDescriptors, name, descriptor, bindProperty);
	}
}


function addDescriptor(shadowDescriptors, name, descriptor, bindProperty) {
	shadowDescriptors[name] = { descriptor, bindProperty };
}