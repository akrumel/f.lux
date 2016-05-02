"use strict";

exports.__esModule = true;
exports.default = iterateOver;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function iterateOver(keys, callback) {
	var i = -1;
	var len = keys.length;

	var next = function next() {
		var key = keys[++i];

		if (i < len) {
			return { value: callback(key), done: false };
		} else {
			return { done: true };
		}
	};

	return _defineProperty({
		next: next
	}, Symbol.iterator, function () {
		return { next: next };
	});
}