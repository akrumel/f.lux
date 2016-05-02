"use strict";

exports.__esModule = true;
exports.default = noParentStateErrorMsg;
function noParentStateErrorMsg(name, parentImpl) {
	var path = parentImpl ? parentImpl.dotPath() : "undefined";

	return "No parent state for non-root shadow property: name=" + name + ", parent=" + path;
}