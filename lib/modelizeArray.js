"use strict";

exports.__esModule = true;
exports.default = modelize;

var _isShadow = require("./isShadow");

var _isShadow2 = _interopRequireDefault(_isShadow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
	Iterates over the values and replaces all shadow models with it's model state. This function
	works in place.
*/
function modelize(values) {
	var value;

	for (var i = 0, len = values.length; i < len; i++) {
		var value = values[i];

		if ((0, _isShadow2.default)(value)) {
			value = value.__.state;
		}
	}
}