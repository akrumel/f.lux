import { assert } from "akutils";
import isNumber from "lodash.isnumber";
import result from "lodash.result";

export default class PojoQueryBuilder {
	constructor() {
		this.filter = [];
	}

	toString() {
		return this.filter.reduce( (acc, f) => {
				return `${acc}${acc.length ?', ' :''}${f[0]}`;
			}, "");
	}

	/*
		Iterates the top-level key/value pairs and filters out any pairs where the value does not pass all
		predicate tests.
	*/
	on(model) {
		return this.filter.reduce( (acc, m, key) => {
				for (let [, predFn] of this.filter) {
					if (!predFn(m)) {
						return acc;
					}
				}

				acc.push(m);

				return acc;
			}, []);
	}

	/*
		Adds a pameter name/value pair to the URL query string.
	*/
	equals(name, value) {
		this.filter.push([`'${name}' == ${value}`,  m => propertyValue(m, name) == value ])

		return this;
	}

	/*
		Adds a pameter name/value pair to the URL query string of the form: name=gt(value).
	*/
	gt(name, value) {
		assert( a => a.is(isNumber(value), "gt() requires a value to be a number") );

		this.filter.push([`'${name}' > ${value}`, m => result(m, name) > value ]);

		return this;
	}

	/*
		Adds a pameter name/value pair to the URL query string of the form: name=gte(value).
	*/
	gte(name, value) {
		assert( a => a.is(isNumber(value), "gte() requires a value to be a number"));

		this.filter.push([`'${name}' >= ${value}`, m => result(m, name) >= value ]);

		return this;
	}

	/*
		Adds a pameter name/value pair to the URL query string of the form: name=lt(value).
	*/
	lt(name, value) {
		assert( a => a.is(isNumber(value), "lt() requires a value to be a number"));

		this.filter.push([`'${name}' < ${value}`, m => result(m, name) < value ]);

		return this;
	}

	/*
		Adds a pameter name/value pair to the URL query string of the form: name=lte(value).
	*/
	lte(name, value) {
		assert( a => a.is(isNumber(value), "lte() requires a value to be a number"));

		this.filter.push([`'${name}' <= ${value}`, m => result(m, name) <= value ]);

		return this;
	}

	/*
		Adds a pameter name/value pair to the URL query string of the form: name=op(value).
	*/
	filterOp(name, op, value) {
		this.filter[name] = `${op}(${value})`;

		return this;
	}

}

