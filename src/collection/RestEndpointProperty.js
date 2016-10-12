import URI from "urijs";

import { getOptions, extendOptions } from "./fetchOptions";
import RestQueryBuilder from "./RestQueryBuilder";

import appDebug from "../debug";
import KeyedProperty from "../KeyedProperty";
import PrimitiveProperty from "../PrimitiveProperty";
import shadow from "../decorators/shadow";
import Store from "../Store";


const debug = appDebug("f.lux:collection");

/*

*/
export default class RestEndpointProperty extends KeyedProperty {
	constructor(initialState) {
		super(initialState, false, true);

		this.addPropertyClass("url", PrimitiveProperty);
	}

	static createFor(url) {
		url = url.endsWith("/") ?url :`${url}/`;

		return new RestEndpointProperty({ url: url });
	}

	static getGlobalOptions() {
		return getOptions();
	}

	static extendGlobalOptions(options) {
		extendOptions(options);
	}


	//------------------------------------------------------------------------------------------------------
	// The Endpoint implementation API
	//------------------------------------------------------------------------------------------------------

	@shadow
	get id() {
 		return this._.url;
 	}

	@shadow
	isConnected() {
		return !!this._.url;
	}

	@shadow
	queryBuilder() {
		return new RestQueryBuilder();
	}

	@shadow
	doCreate(shadowModel, model) {
		const url = this._.url;
		const options = getOptions("POST", {
				body: JSON.stringify(model),
				headers: {
					'Content-Type': 'application/json'
				},
			});

		return fetch(url, options)
			.then( response => {
					if (!response.ok) {
						return rejectOnError(response, url.toString());
					}

					return response.json();
				})
	}

	@shadow
	doDelete(id, options={}) {
		const uri = URI(`${id}`).absoluteTo(this._.url);

		return fetch(uri.toString(), getOptions("DELETE", options))
			.then( response => {
					if (!response.ok) {
						return rejectOnError(response, uri.toString());
					}

					return id;
				});
	}

	@shadow
	doFetch(filter) {
		const url = filter ?filter.applyFilter(this._.url) :this._.url;

		return fetch(url, getOptions("GET"))
			.then( response => {
					if (!response.ok) {
						return rejectOnError(response, url.toString());
					}

					return response.json();
				})
	}

	@shadow
	doFind(id) {
		const uri = URI(`${id}`).absoluteTo(this._.url);

		return fetch(uri.toString(), getOptions("GET"))
			.then( response => {
					if (!response.ok) {
						return rejectOnError(response, uri.toString());
					}

					return response.json();
				});
	}

	@shadow
	doUpdate(id, shadowModel, changedProps) {
		const uri = URI(`${id}`).absoluteTo(this._.url);
		const options = {
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(changedProps),
			};
		return fetch(uri.toString(), getOptions("PUT", options))
			.then( response => {
					if (!response.ok) {
						return rejectOnError(response, uri.toString());
					}

					return response.json();
				});
	}
}

function rejectOnError(response, url) {
	const error = new Error(`${response.statusText} - status=${response.status}`);

	error.url = url;
	error.status = response.status;
	error.response = response;

	// TODO: extract text and generate a standard error description value (like login) that will make
	//       sense across end point types
	response.text( text => debug(`RestEndpointProperty error: status=${response.status}, text=${text}`));

	return Store.reject(error);
}
