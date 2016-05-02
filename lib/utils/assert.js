"use strict";

exports.__esModule = true;

var _lodash = require("lodash.has");

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require("lodash.isequal");

var _lodash4 = _interopRequireDefault(_lodash3);

var _isObject = require("./isObject");

var _isObject2 = _interopRequireDefault(_isObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
	Efficiently implements assertions by performing a noop when not in development mode, eg 
	config.development == false. This means code like the following will not evaluate the
	@isRoot() call when not in development mode.

	assert (a) => a.not(@isRoot(), "root properties do not have parents")
*/
var assert = {
	equal: function equal(a, b) {
		if ((0, _isObject2.default)(a)) {
			if (!(0, _lodash4.default)(a, b)) {
				assertFailed("Objects not equal");
			}
		} else if (a != b) {
			assertFailed(a + " != " + b);
		}

		return this;
	},
	not: function not(val) {
		var msg = arguments.length <= 1 || arguments[1] === undefined ? "" : arguments[1];

		if (val) assertFailed(msg);

		return this;
	},
	is: function is(val) {
		var msg = arguments.length <= 1 || arguments[1] === undefined ? "" : arguments[1];

		if (!val) assertFailed(msg);

		return this;
	},
	has: function has(obj) {
		for (var _len = arguments.length, keys = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			keys[_key - 1] = arguments[_key];
		}

		for (var i = 0, len = keys.length; i < len; i++) {
			if (!(0, _lodash2.default)(obj, keys[i])) {
				assertFailed("Object does not have key=" + k);
			}
		}

		return this;
	},
	hasOne: function hasOne(obj) {
		for (var _len2 = arguments.length, keys = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
			keys[_key2 - 1] = arguments[_key2];
		}

		for (var i = 0, len = keys.length; i < len; i++) {
			if ((0, _lodash2.default)(obj, keys[i])) {
				return this;
			}
		}

		assertFailed("Object does not have one of keys: " + keys.join(", "));
	}
};

function assertFailed(msg) {
	// do not write to consoule during testing
	if (typeof config != 'undefined' && !config.test) {
		console.error("Assertion failed: " + msg);
		alert("Assertion Failed: " + msg + "\n\nSee console for details.");
	}

	throw new Error(msg);
}

exports.default = function (cb, context) {
	if (typeof config != 'undefined' && (config.development || config.debug)) {
		cb.call(context, assert);
	}
};