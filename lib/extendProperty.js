"use strict";

exports.__esModule = true;
exports.default = extendProperty;

var _lodash = require("lodash.has");

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require("lodash.isfunction");

var _lodash4 = _interopRequireDefault(_lodash3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
	Extends a shadow property with the definition returned by the assoicated Property shadow() method.

	NOTE: function must be called after subclasses are created.
*/
function extendProperty(property, impl, shadow) {
	var proto = Object.getPrototypeOf(property);
	var shadowDescriptors = proto.constructor.shadowDescriptors;

	if (shadowDescriptors) {
		defineProperties(shadowDescriptors, shadow, property, impl);
	}

	// define mixin shadow properties
	var mixins, mixinDescriptors, mixinDesc;

	if (property.__hasMixins()) {
		var _mixins = property.__mixins();

		for (var i = 0, len = _mixins.length; i < len; i++) {
			mixinDescriptors = _mixins[i].__shadowDescriptors__;

			if (mixinDescriptors) {
				defineProperties(mixinDescriptors, shadow, property, impl, true);
			}
		}
	}
}

function defineProperties(shadowDescriptors, shadow, property, impl, mixin) {
	for (var name in shadowDescriptors) {
		if ((0, _lodash2.default)(shadow, name) || shadow[name]) {
			console.warn("Property name conflict: name=" + name + ", path=" + impl.slashPath() + ", mixin-source=" + !!mixin);

			continue;
		}

		var _shadowDescriptors$na = shadowDescriptors[name];
		var descriptor = _shadowDescriptors$na.descriptor;
		var bindProperty = _shadowDescriptors$na.bindProperty;


		if ((0, _lodash4.default)(descriptor.value)) {
			var value = bindProperty ? descriptor.value.bind(property) : descriptor.value;

			// Functions are not enumerable in javascript classes so adher to convention
			Object.defineProperty(shadow, name, {
				enumerable: false,
				value: value
			});
		} else {
			var enumerable = descriptor.enumerable && !name.startsWith('_');
			var get = bindProperty && descriptor.get ? descriptor.get.bind(property) : descriptor.get;
			var set = bindProperty && descriptor.set ? descriptor.set.bind(property) : descriptor.set;

			if (descriptor.get) {
				Object.defineProperty(shadow, name, {
					enumerable: enumerable,
					get: get, // && descriptor.get.bind(property),
					set: set });
			} else // && descriptor.set.bind(property),
				{
					Object.defineProperty(shadow, name, {
						enumerable: enumerable,
						value: descriptor.value,
						writable: false
					});
				}
		}
	}
}