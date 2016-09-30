import isShadow from "./isShadow";

/*
	Iterates over the values and replaces all shadow models with it's model state. This function
	works in place.
*/
export default function modelize(values) {
	var value;

	for (let i=0, len=values.length; i<len; i++) {
		var value = values[i];

		if (isShadow(value)) {
			value = value.__.state();
		}
	}
}