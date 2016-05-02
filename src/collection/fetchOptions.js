
// https://developer.mozilla.org/en-US/docs/Web/API/Request
var globalOptions = { };


export function extendOptions(options) {
	Object.assign(globalOptions, options);
}

export function getOptions(method, ...options) {
	return Object.assign({ method: method }, globalOptions, ...options);
}

export function setOptions(options) {
	globalOptions = options;
}
