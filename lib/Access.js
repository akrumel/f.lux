"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash.has");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Access = function () {
	function Access(impl) {
		_classCallCheck(this, Access);

		// invisible property for the internals
		Object.defineProperty(this, '__', { enumerable: true, value: impl });
	}

	_createClass(Access, [{
		key: "property",
		value: function property() {
			return this.__.property;
		}
	}, {
		key: "isValid",
		value: function isValid() {
			return this.__.isValid();
		}
	}, {
		key: "isActive",
		value: function isActive() {
			return this.__.isActive();
		}
	}, {
		key: "latest",
		value: function latest() {
			var impl = this.__.latest();

			return impl && impl.shadow();
		}
	}, {
		key: "nextState",
		value: function nextState() {
			return this.__.nextState();
		}
	}, {
		key: "path",
		value: function path() {
			return this.__.path();
		}
	}, {
		key: "rootShadow",
		value: function rootShadow() {
			return this.__.root.shadow();
		}
	}, {
		key: "slashPath",
		value: function slashPath() {
			return this.__.slashPath();
		}
	}, {
		key: "shadow",
		value: function shadow() {
			return this.__.shadow();
		}
	}, {
		key: "state",
		value: function state() {
			return this.__.state;
		}

		/*
  	Performs an update on the state values. 
  		The callback should be pure and have the form:
  			callback(nextState) : nextState
  				 - or - 
  			callback(nextState) : { name, nextState }
  		The 'nextState' parameter is a javascript object (not a shadow) that represents the next state starting
  	from the current state and having all the actions in the current tick applied to it before this update()
  	call.
  		if the callback returns an object should be:
  		name - a stort moniker identifying the update call purpose. This will passed to the store middleware.  
  			This value is optional with the default value being '[path].$.update()'.
  		nextState - the value for the next state after the update functionality
  */

	}, {
		key: "update",
		value: function update(callback) {
			var _this = this;

			this.__.update(function (next) {
				var result = callback(next);

				result = (0, _lodash2.default)(result, "nextState") ? result : { nextState: nexresultt };

				// mark as a replacement (expensive but conservative) since very unlikely a caller through the access
				// variable will have made all the book keeping updates and no way of knowing how deep their changes
				// were in the object hierarchy.
				return {
					name: result.name || _this.slashPath() + ".$.update()",
					nextState: result.nextState,
					replace: true
				};
			});
		}
	}, {
		key: "waitFor",
		value: function waitFor(callback) {
			var _this2 = this;

			this.store.waitFor(function () {
				var latest = _this2.latest();

				callback(latest && latest.shadow());
			});
		}
	}]);

	return Access;
}();

exports.default = Access;