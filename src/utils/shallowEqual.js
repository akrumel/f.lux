// Borrowed from facebooks fbjs - they make no guarantees in the package the code will hang around
// https://github.com/facebook/fbjs/blob/master/src/core/shallowEqual.js

// need to figure out property licensing header and attribution

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
export default function shallowEqual(objA, objB) {
	if (objA === objB) {
		return true;
	}

	if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
		return false;
	}

	const keysA = Object.keys(objA);
	const keysB = Object.keys(objB);

	if (keysA.length !== keysB.length) {
		return false;
	}

	// Test for A's keys different from B.
	for (let i = 0, aKeyLen=keysA.length; i<aKeyLen ; i++) {
		if (!hasOwnProperty.call(objB, keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
			return false;
		}
	}

	return true;
}
