'use strict';

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _urijs = require('urijs');

var _urijs2 = _interopRequireDefault(_urijs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RestQueryBuilder = function () {
	function RestQueryBuilder() {
		_classCallCheck(this, RestQueryBuilder);

		this.filter = {};
	}

	_createClass(RestQueryBuilder, [{
		key: 'toString',
		value: function toString() {
			return _.reduce(this.filter, function (memo, n, v) {
				return '\'' + memo + (memo.length ? ', ' : '') + n + '=' + v;
			}, "");
		}

		/**
  	Updates the collection URL instance variable. 
  		Note: This method will permanently overwrite the currently set URL.
  */

	}, {
		key: 'applyFilter',
		value: function applyFilter(url) {
			var uri = new _urijs2.default(url);

			uri.setSearch(this.filter);

			return uri.toString();
		}

		/*
  	Adds a pameter name/value pair to the URL query string.
  */

	}, {
		key: 'equals',
		value: function equals(name, value) {
			this.filter[name] = value;

			return this;
		}

		/*
  	Adds a pameter name/value pair to the URL query string of the form: name=gt(value).
  */

	}, {
		key: 'gt',
		value: function gt(name, value) {
			return this.filterOp(name, 'gt', value);
		}

		/*
  	Adds a pameter name/value pair to the URL query string of the form: name=gte(value).
  */

	}, {
		key: 'gte',
		value: function gte(name, value) {
			return this.filterOp(name, 'gte', value);
		}

		/*
  	Adds a pameter name/value pair to the URL query string of the form: name=lt(value).
  */

	}, {
		key: 'lt',
		value: function lt(name, value) {
			return this.filterOp(name, 'lt', value);
		}

		/*
  	Adds a pameter name/value pair to the URL query string of the form: name=lte(value).
  */

	}, {
		key: 'lte',
		value: function lte(name, value) {
			return this.filterOp(name, 'lte', value);
		}

		/*
  	Adds a pameter name/value pair to the URL query string of the form: name=op(value).
  */

	}, {
		key: 'filterOp',
		value: function filterOp(name, op, value) {
			this.filter[name] = op + '(' + value + ')';

			return this;
		}
	}]);

	return RestQueryBuilder;
}();

exports.default = RestQueryBuilder;