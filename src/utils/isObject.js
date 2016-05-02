
export default function isObject(obj) {
	return obj === Object(obj) && Object.prototype.toString.call(obj) !== '[object Array]';
}