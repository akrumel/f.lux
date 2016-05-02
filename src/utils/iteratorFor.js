
export default function iteratorFor(values) {
	var i = -1;
	const len = values.length;

	const next = () => {
		const value = values[++i];

		if (i < len) {
			return { value: value, done: false };
		} else {
			return { done: true }
		}
	}
	
	return {
		next: next,
		[Symbol.iterator]() { return { next: next } }
	}
}