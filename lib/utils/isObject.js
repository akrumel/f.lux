'use strict';

exports.__esModule = true;
exports.default = isObject;
function isObject(obj) {
	return obj === Object(obj) && Object.prototype.toString.call(obj) !== '[object Array]';
}