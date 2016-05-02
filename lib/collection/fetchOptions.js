"use strict";

exports.__esModule = true;
exports.extendOptions = extendOptions;
exports.getOptions = getOptions;
exports.setOptions = setOptions;

// https://developer.mozilla.org/en-US/docs/Web/API/Request
var globalOptions = {};

function extendOptions(options) {
	Object.assign(globalOptions, options);
}

function getOptions(method) {
	for (var _len = arguments.length, options = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		options[_key - 1] = arguments[_key];
	}

	return Object.assign.apply(Object, [{ method: method }, globalOptions].concat(options));
}

function setOptions(options) {
	globalOptions = options;
}