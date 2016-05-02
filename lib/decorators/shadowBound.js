"use strict";

exports.__esModule = true;
exports.default = shadowBound;

var _shadowPropertyHelper = require("./shadowPropertyHelper");

var _shadowPropertyHelper2 = _interopRequireDefault(_shadowPropertyHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
	A Property decorator for marking methods and properties (get/set) as being part of the shadow with
	the methods *bound* to the property. Use this decorator version when you Property method is not
	dependent on using the state at the time the shadow reference may have been saved to a veriable
	or you method is requires a majority of accesses to the Property subclass instance variables 
	instead of the shadow state.

	Example:

		@shadowBound
		logout() {
			// delete is a method in the Property subclass and not dependent on the current state
			this.delete(_user);
		}

*/
function shadowBound(target, name, descriptor) {
	(0, _shadowPropertyHelper2.default)(target, name, descriptor, true);
}