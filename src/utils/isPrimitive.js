// from http://cwestblog.com/2011/08/02/javascript-isprimitive-function/

export default function isPrimitive(arg) {
	const type = typeof arg;

	return arg == null || (type != "object" && type != "function");
}