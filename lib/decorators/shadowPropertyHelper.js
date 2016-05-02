"use strict";

exports.__esModule = true;
exports.default = shadowPropertyHelper;

var _lodash = require("lodash.isplainobject");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function shadowPropertyHelper(target, name, descriptor) {
	var bindProperty = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

	if ((0, _lodash2.default)(target)) {
		// mixin method
		if (!target.__shadowDescriptors__) {
			target.__shadowDescriptors__ = {};
		}

		addDescriptor(target.__shadowDescriptors__, name, descriptor, bindProperty);
	} else {
		// Property subclass method
		var ctor = target.constructor;

		if (!ctor.shadowDescriptors) {
			ctor.shadowDescriptors = {};
		}

		addDescriptor(ctor.shadowDescriptors, name, descriptor, bindProperty);
	}
}

function addDescriptor(shadowDescriptors, name, descriptor, bindProperty) {
	shadowDescriptors[name] = { descriptor: descriptor, bindProperty: bindProperty };
}