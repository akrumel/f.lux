"use strict";

exports.__esModule = true;
exports.default = shadow;

var _shadowPropertyHelper = require("./shadowPropertyHelper");

var _shadowPropertyHelper2 = _interopRequireDefault(_shadowPropertyHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
	A Property decorator for marking methods and properties (get/set) as being part of the shadow. 

	Example:

		@shadow
		get user() { 
			return { name: "Andy" } 
		}

		@shadow
		isAdmin() {
			return true;
		}

*/
function shadow(target, name, descriptor) {
	(0, _shadowPropertyHelper2.default)(target, name, descriptor);
}