"use strict";

exports.__esModule = true;
exports.default = shadowProperty;

var _isObject = require("./utils/isObject");

var _isObject2 = _interopRequireDefault(_isObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
	Function used by shaders to instantiate shadow implementation classes, subclasses of ShadowImpl.
*/
function shadowProperty(time, ImplClass, property) {
	var impl = new ImplClass(time, property, arguments.length <= 3 ? undefined : arguments[3], arguments.length <= 4 ? undefined : arguments[4], arguments.length <= 5 ? undefined : arguments[5], arguments.length <= 6 ? undefined : arguments[6], arguments.length <= 7 ? undefined : arguments[7], arguments.length <= 8 ? undefined : arguments[8], arguments.length <= 9 ? undefined : arguments[9], arguments.length <= 10 ? undefined : arguments[10], arguments.length <= 11 ? undefined : arguments[11]);

	if (property.readonly) {
		impl.setReadonly(true);
	}

	impl.setupPropertyAccess();

	return impl;
}