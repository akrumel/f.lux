"use strict";

exports.__esModule = true;
exports.default = automount;

/*
	Class level decorator that marks a Property subclass as needing to automount when
	the parent is shadowed. This is useful for implementing mixin properties that provide
	behavior for the parent property. Using automount will cause the child property to 
	be immediately shadowed and not wait for the app to access it.

	Example:
		@automount
		class PostopSubscriptionMixinProperty extends KeyedProperty {
			...
		}
*/
function automount(target) {
	if (!target.prototype) {
		throw new SyntaxError("@automount() must be applied to a class.");
	}

	target.shouldAutomount = function () {
		return true;
	};
}