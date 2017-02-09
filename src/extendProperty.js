import has from "lodash.has";
import isFunction from "lodash.isfunction";

/**
	Extends a shadow property with the definition returned by the assoicated Property methods
	marked using the @shadow and @shadowBound decorators.

	NOTE: function must be called after subclasses are created.

	@ignore
*/
export default function extendProperty(property, impl, shadow) {
	const proto = Object.getPrototypeOf(property);
	const shadowDescriptors = proto.constructor.shadowDescriptors;

	if (shadowDescriptors) {
		defineProperties(shadowDescriptors, shadow, property, impl);
	}

	// define mixin shadow properties
	var mixins, mixinDescriptors, mixinDesc;

	if (property.__hasMixins()) {
		let mixins = property.__mixins();

		for (let i=0, len=mixins.length; i<len; i++) {
			mixinDescriptors = mixins[i].__shadowDescriptors__;

			if (mixinDescriptors) {
				defineProperties(mixinDescriptors, shadow, property, impl, true);
			}
		}
	}
}

function defineProperties(shadowDescriptors, shadow, property, impl, mixin) {
	for (let name in shadowDescriptors) {
		if (has(shadow, name) || shadow[name]) {
			console.warn(`Property name conflict: name=${name}, path=${impl.slashPath()}, mixin-source=${!!mixin}`);

			continue;
		}

		const { descriptor, bindProperty } = shadowDescriptors[name];

		if (isFunction(descriptor.value)) {
			const value = bindProperty ?descriptor.value.bind(property) :descriptor.value;

			// Functions are not enumerable in javascript classes so adher to convention
			Object.defineProperty(shadow, name, {
					enumerable: false,
					value: value
				});
		} else {
			const enumerable = descriptor.enumerable && !name.startsWith('_');
			const get = bindProperty && descriptor.get ?descriptor.get.bind(property) :descriptor.get
			const set = bindProperty && descriptor.set ?descriptor.set.bind(property) :descriptor.set

			if (descriptor.get) {
				Object.defineProperty(shadow, name, {
						enumerable: enumerable,
						get: get, // && descriptor.get.bind(property),
						set: set, // && descriptor.set.bind(property),
					});
			} else {
				Object.defineProperty(shadow, name, {
						enumerable: enumerable,
						value: descriptor.value,
						writable: false,
					});
			}
		}
	}
}
