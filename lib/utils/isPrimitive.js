"use strict";

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = isPrimitive;
// from http://cwestblog.com/2011/08/02/javascript-isprimitive-function/

function isPrimitive(arg) {
	var type = typeof arg === "undefined" ? "undefined" : _typeof(arg);

	return arg == null || type != "object" && type != "function";
}