"use strict";

exports.__esModule = true;
exports.default = isShadow;
function isShadow(obj) {
	return obj && obj.__ && obj.$;
}