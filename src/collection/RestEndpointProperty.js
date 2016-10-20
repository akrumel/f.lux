import URI from "urijs";

import { getOptions, extendOptions } from "./fetchOptions";
import RestQueryBuilder from "./RestQueryBuilder";

import KeyedProperty from "../KeyedProperty";
import PrimitiveProperty from "../PrimitiveProperty";
import shadow from "../decorators/shadow";
import Store from "../Store";

import appDebug, { CollectionRestEndpointPropertyKey as DebugKey } from "../debug";
const debug = appDebug(DebugKey);

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
 		return this._().url;
 	}

	@shadow
	isConnected() {
		return !!this._().url;
	}

	@shadow
	queryBuilder() {
		return new RestQueryBuilder();
	}

	@shadow
	doCreate(shadowModel, model) {
		const url = this._().url;
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
		const uri = URI(`${id}`).absoluteTo(this._().url);

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
		const startTime = Date.now();
		const url = filter ?filter.applyFilter(this._().url) :this._().url;

		debug( d => d(`doFetch() - path=${ this.$().dotPath() }, url=${url}`) );

		return fetch(url, getOptions("GET"))
			.then( response => {
					debug( d => d(`doFetch() response - path=${ this.$().dotPath() }, url=${url}, ok=${response.ok}, ` +
						`elapsed=${Date.now() - startTime}`, response) );

					if (!response.ok) {
						return rejectOnError(response, url.toString());
					}

					return response.json();
				})
			.then( json => {
					debug( d => d(`doFetch() success - path=${ this.$().dotPath() }, url=${url}, ` +
						`elapsed=${ Date.now() - startTime }`, json) );

					return json;
				})
			.catch( error => {
				debug( d => d(`doFetch() Fetch Error - path=${ this.$().dotPath() }, url=${url}`, error) );

				return Promise.reject(error);
			})
	}

	@shadow
	doFind(id) {
		const uri = URI(`${id}`).absoluteTo(this._().url);

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
		const uri = URI(`${id}`).absoluteTo(this._().url);
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

// TODO: extract text and generate a standard error description value (like login) that will make
//       sense across end point types
function rejectOnError(response, url) {
	const error = new Error(`${response.statusText} - status=${response.status}`);

	error.url = url;
	error.status = response.status;
	error.response = response;

	debug( d => response.text( text =>  d(`Response Error - url=${url}, text=${ text }`, response) ) );

	return Store.reject(error);
}
