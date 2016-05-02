"use strict";

exports.__esModule = true;
exports.default = createObject;
function createObject(ctor) {
	var factoryFunction = ctor.bind.apply(ctor, arguments);

	return new factoryFunction();
}