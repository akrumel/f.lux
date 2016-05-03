import has from "lodash.has";
import isEqual from "lodash.isequal";

import isObject from "./isObject";

/*
	Efficiently implements assertions by performing a noop when not in development mode, eg
	config.development == false. This means code like the following will not evaluate the
	@isRoot() call when not in development mode.

	assert (a) => a.not(@isRoot(), "root properties do not have parents")
*/
var assert = {
	equal(a, b) {
		if (isObject(a)) {
			if (!isEqual(a, b)) {
				assertFailed("Objects not equal");
			}
		} else if (a != b) {
			assertFailed(`${a} != ${b}`);
		}

		return this;
	},

	not(val, msg="") {
		if (val) assertFailed(msg);

		return this;
	},

	is(val, msg="") {
		if (!val) assertFailed(msg);

		return this;
	},

	has(obj, ...keys) {
		for (let i=0, len=keys.length; i<len; i++) {
			if (!has(obj, keys[i])) {
				assertFailed(`Object does not have key=${k}`)
			}
		}

		return this;
	},

	hasOne(obj, ...keys) {
		for (let i=0, len=keys.length; i<len; i++) {
			if (has(obj, keys[i])) {
				return this;
			}
		}

		assertFailed(`Object does not have one of keys: ${keys.join(", ")}`);
	}
};

function assertFailed(msg) {
	// do not write to consoule during testing
	if (typeof config != 'undefined' && !config.test) {
		console.error(`Assertion failed: ${msg}`);
		alert(`Assertion Failed: ${ msg }\n\nSee console for details.`);
	}

	throw new Error(msg);
}

export default function assert(cb, context) {
	var configDebug = typeof config != 'undefined' && (config.development || config.debug);
	var envDevelopment = process.env.NODE_ENV !== 'production';

	if (configDebug || envDevelopment) {
		cb.call(context, assert);
	}
}