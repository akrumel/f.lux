
export default function iterateOver(keys, callback) {
	var i = -1;
	const len = keys.length;

	const next = () => {
		const key = keys[++i];

		if (i < len) {
			return { value: callback(key), done: false };
		} else {
			return { done: true }
		}
	}
	
	return {
		next: next,
		[Symbol.iterator]() { return { next: next } }
	}
}