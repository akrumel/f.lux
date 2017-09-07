// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
export default function hashcode(str="") {
	const length = str.length;
	var hash = 0, i, chr;

	if (length === 0) return hash;

	for (i = 0; i < length; i++) {
		chr   = str.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}

	return hash;
}
