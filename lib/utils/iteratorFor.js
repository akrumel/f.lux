"use strict";

exports.__esModule = true;
exports.default = iteratorFor;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function iteratorFor(values) {
	var i = -1;
	var len = values.length;

	var next = function next() {
		var value = values[++i];

		if (i < len) {
			return { value: value, done: false };
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