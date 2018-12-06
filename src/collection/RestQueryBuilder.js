import URI from "urijs";


export default class RestQueryBuilder {
	constructor() {
		this.filter = { };
	}

	toString() {
		return Object.keys(this.filter)
			.reduce( (memo, n, v) => {
					return `'${memo}${memo.length ?', ' :''}${n}=${v}`;
				}, "");
	}

	/**
		Updates the collection URL instance variable.

		Note: This method will permanently overwrite the currently set URL.
	*/
	applyFilter(url) {
		const uri = new URI(url);

		uri.setSearch(this.filter);

		return uri.toString();
	}

	/*
		Adds a pameter name/value pair to the URL query string.
	*/
	equals(name, value) {
		this.filter[name] = value;

		return this;
	}

	/*
		Adds a pameter name/value pair to the URL query string of the form: name=gt(value).
	*/
	gt(name, value) {
		return this.filterOp(name, 'gt', value);
	}

	/*
		Adds a pameter name/value pair to the URL query string of the form: name=gte(value).
	*/
	gte(name, value) {
		return this.filterOp(name, 'gte', value);
	}

	/*
		Adds a pameter name/value pair to the URL query string of the form: name=lt(value).
	*/
	lt(name, value) {
		return this.filterOp(name, 'lt', value);
	}

	/*
		Adds a pameter name/value pair to the URL query string of the form: name=lte(value).
	*/
	lte(name, value) {
		return this.filterOp(name, 'lte', value);
	}

	/*
		Adds a pameter name/value pair to the URL query string of the form: name=op(value).
	*/
	filterOp(name, op, value) {
		this.filter[name] = `${op}(${value})`;

		return this;
	}

}

