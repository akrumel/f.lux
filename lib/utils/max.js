"use strict";

exports.__esModule = true;
exports.default = max;

function identity(value) {
	return value;
}

function max(array) {
	var iteratee = arguments.length <= 1 || arguments[1] === undefined ? identity : arguments[1];

	if (!array || !array.length) {
		return;
	}

	var len = array.length;
	var index = -1;
	var result, value, computed;

	while (++index < len) {
		value = array[index];
		computed = iteratee(value);

		result = computed > result ? computed : result;
	}

	return result;
}