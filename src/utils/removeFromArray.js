
/*
	Removes all instances of a value from an array in place.
*/
export default function removeFromArray(elts, value) {
	if (!elts) { return elts }
		
	var index;

	while((index = elts.indexOf(value)) != -1) {
    	elts.splice(index, 1);
	}

	return elts;
}