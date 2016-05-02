"use strict";

exports.__esModule = true;
exports.default = removeFromArray;

/*
	Removes all instances of a value from an array in place.
*/
function removeFromArray(elts, value) {
	if (!elts) {
		return elts;
	}

	var index;

	while ((index = elts.indexOf(value)) != -1) {
		elts.splice(index, 1);
	}

	return elts;
}