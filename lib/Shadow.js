'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Shadow = function () {
	function Shadow(impl) {
		_classCallCheck(this, Shadow);

		// these properties are all NOT enumerable so calls like Object.keys() work correctly
		Object.defineProperty(this, '$', { enumerable: false, get: function get() {
				return impl.access;
			} });
		Object.defineProperty(this, '__', { enumerable: false, get: function get() {
				return impl;
			} });
		Object.defineProperty(this, '$$', { enumerable: false, get: function get() {
				return impl.property;
			} });

		// for @state Property mappings - just this object
		Object.defineProperty(this, '_', { enumerable: false, value: this });

		// easy debug access to the raw state
		Object.defineProperty(this, '__state__', { enumerable: false, value: impl.state });
	}

	_createClass(Shadow, [{
		key: 'toString',
		value: function toString() {
			return JSON.stringify(this);
		}
	}, {
		key: 'toJSON',
		value: function toJSON() {
			return this.__.state;
		}
	}], [{
		key: 'attachState',
		value: function (_attachState) {
			function attachState(_x) {
				return _attachState.apply(this, arguments);
			}

			attachState.toString = function () {
				return _attachState.toString();
			};

			return attachState;
		}(function (attach) {
			attachState = attach;
		})
	}]);

	return Shadow;
}();

exports.default = Shadow;