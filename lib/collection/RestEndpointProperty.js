"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class;

var _urijs = require("urijs");

var _urijs2 = _interopRequireDefault(_urijs);

var _KeyedProperty2 = require("../KeyedProperty");

var _KeyedProperty3 = _interopRequireDefault(_KeyedProperty2);

var _PrimitiveProperty = require("../PrimitiveProperty");

var _PrimitiveProperty2 = _interopRequireDefault(_PrimitiveProperty);

var _shadow = require("../decorators/shadow");

var _shadow2 = _interopRequireDefault(_shadow);

var _Store = require("../Store");

var _Store2 = _interopRequireDefault(_Store);

var _fetchOptions = require("./fetchOptions");

var _RestQueryBuilder = require("./RestQueryBuilder");

var _RestQueryBuilder2 = _interopRequireDefault(_RestQueryBuilder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
	var desc = {};
	Object['ke' + 'ys'](descriptor).forEach(function (key) {
		desc[key] = descriptor[key];
	});
	desc.enumerable = !!desc.enumerable;
	desc.configurable = !!desc.configurable;

	if ('value' in desc || desc.initializer) {
		desc.writable = true;
	}

	desc = decorators.slice().reverse().reduce(function (desc, decorator) {
		return decorator(target, property, desc) || desc;
	}, desc);

	if (context && desc.initializer !== void 0) {
		desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
		desc.initializer = undefined;
	}

	if (desc.initializer === void 0) {
		Object['define' + 'Property'](target, property, desc);
		desc = null;
	}

	return desc;
}

/*

*/
var RestEndpointProperty = (_class = function (_KeyedProperty) {
	_inherits(RestEndpointProperty, _KeyedProperty);

	function RestEndpointProperty(initialState) {
		_classCallCheck(this, RestEndpointProperty);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(RestEndpointProperty).call(this, initialState, false, true));

		_this.addPropertyClass("url", _PrimitiveProperty2.default);
		return _this;
	}

	_createClass(RestEndpointProperty, [{
		key: "isConnected",
		value: function isConnected() {
			return !!this._.url;
		}
	}, {
		key: "queryBuilder",
		value: function queryBuilder() {
			return new _RestQueryBuilder2.default();
		}
	}, {
		key: "doCreate",
		value: function doCreate(shadowModel, model) {
			return fetch(this._.url, (0, _fetchOptions.getOptions)("POST", { body: JSON.stringify(model) })).then(function (response) {
				if (!response.ok) {
					return rejectOnError(response, url.toString());
				}

				return response.json();
			});
		}
	}, {
		key: "doDelete",
		value: function doDelete(id) {
			var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			var uri = (0, _urijs2.default)("" + id).absoluteTo(this._.url);

			return fetch(uri.toString(), (0, _fetchOptions.getOptions)("DELETE", options)).then(function (response) {
				if (!response.ok) {
					return rejectOnError(response, uri.toString());
				}

				return id;
			});
		}
	}, {
		key: "doFetch",
		value: function doFetch(filter) {
			var url = filter ? filter.applyFilter(this._.url) : this._.url;

			return fetch(url, (0, _fetchOptions.getOptions)("GET")).then(function (response) {
				if (!response.ok) {
					return rejectOnError(response, url.toString());
				}

				return response.json();
			});
		}
	}, {
		key: "doFind",
		value: function doFind(id) {
			var uri = (0, _urijs2.default)("" + id).absoluteTo(this._.url);

			return fetch(uri.toString(), (0, _fetchOptions.getOptions)("GET")).then(function (response) {
				if (!response.ok) {
					return rejectOnError(response, uri.toString());
				}

				return response.json();
			});
		}
	}, {
		key: "doUpdate",
		value: function doUpdate(id, shadowModel, changedProps) {
			var uri = (0, _urijs2.default)("" + id).absoluteTo(this._.url);
			var options = {
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(changedProps)
			};

			return fetch(uri.toString(), (0, _fetchOptions.getOptions)("PUT", options)).then(function (response) {
				if (!response.ok) {
					return rejectOnError(response, uri.toString());
				}

				return response.json();
			});
		}
	}, {
		key: "id",
		get: function get() {
			return this._.url;
		}
	}], [{
		key: "createFor",
		value: function createFor(url) {
			url = url.endsWith("/") ? url : url + "/";

			return new RestEndpointProperty({ url: url });
		}
	}, {
		key: "getGlobalOptions",
		value: function getGlobalOptions() {
			return (0, _fetchOptions.getOptions)();
		}
	}, {
		key: "extendGlobalOptions",
		value: function extendGlobalOptions(options) {
			(0, _fetchOptions.extendOptions)(options);
		}

		//------------------------------------------------------------------------------------------------------
		// The Endpoint implementation API
		//------------------------------------------------------------------------------------------------------

	}]);

	return RestEndpointProperty;
}(_KeyedProperty3.default), (_applyDecoratedDescriptor(_class.prototype, "id", [_shadow2.default], Object.getOwnPropertyDescriptor(_class.prototype, "id"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "isConnected", [_shadow2.default], Object.getOwnPropertyDescriptor(_class.prototype, "isConnected"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "queryBuilder", [_shadow2.default], Object.getOwnPropertyDescriptor(_class.prototype, "queryBuilder"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "doCreate", [_shadow2.default], Object.getOwnPropertyDescriptor(_class.prototype, "doCreate"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "doDelete", [_shadow2.default], Object.getOwnPropertyDescriptor(_class.prototype, "doDelete"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "doFetch", [_shadow2.default], Object.getOwnPropertyDescriptor(_class.prototype, "doFetch"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "doFind", [_shadow2.default], Object.getOwnPropertyDescriptor(_class.prototype, "doFind"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "doUpdate", [_shadow2.default], Object.getOwnPropertyDescriptor(_class.prototype, "doUpdate"), _class.prototype)), _class);
exports.default = RestEndpointProperty;


function rejectOnError(response, url) {
	var error = new Error(response.statusText + " - status=" + response.status);

	error.url = url;
	error.status = response.status;
	error.response = response;

	// TODO: extract text and generate a standard error description value (like login) that will make
	//       sense across end point types
	response.text(function (text) {
		return console.warn("RestEndpointProperty error: status=" + response.status + ", text=" + text);
	});

	return _Store2.default.reject(error);
}