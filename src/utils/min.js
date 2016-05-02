
function identity(value) {
	return value;
}

export default function max(array, iteratee=identity) {
	if (!array || !array.length) { return }

	const len = array.length;
	var index = -1;
	var result, value, computed;

	while (++index < len) {
		value = array[index];
		computed = iteratee(value);

		result = computed < result ?computed :result;
	}

	return result;
}