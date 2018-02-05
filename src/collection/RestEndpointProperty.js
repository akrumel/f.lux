import URI from "urijs";

import { getOptions, extendOptions } from "./fetchOptions";
import RestQueryBuilder from "./RestQueryBuilder";

import ObjectProperty from "../ObjectProperty";
import PrimitiveProperty from "../PrimitiveProperty";
import shadow from "../decorators/shadow";
import shadowBound from "../decorators/shadowBound";
import StateType from "../StateType";
import Store from "../Store";

import appDebug, { CollectionRestEndpointPropertyKey as DebugKey } from "../debug";
const debug = appDebug(DebugKey);

/*

*/
export default class RestEndpointProperty extends ObjectProperty {
	constructor(stateType=RestEndpointProperty.type) {
		super(stateType);

		this._keyed.addPropertyType("url", PrimitiveProperty.type);
		this.findCache = {};
	}

	static createFor(url) {
		const type = RestEndpointProperty.type
			.initialState({ url: url.endsWith("/") || url.indexOf("?") !== -1 ?url :`${url}/` })

		return new RestEndpointProperty(type);
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
		return !!this.id;
	}

	@shadow
	queryBuilder() {
		return new RestQueryBuilder();
	}

	@shadow
	doCreate(shadowModel, model) {
		const url = this.id;
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
		const uri = URI(`${id}`).absoluteTo(this.id);

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
		const url = filter ?filter.applyFilter(this.id) :this.id;

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

	@shadowBound
	doFind(id) {
		const uri = URI(`${id}`).absoluteTo(this.id);

		if (!this.findCache[uri]) {
			this.findCache[uri] = fetch(uri.toString(), getOptions("GET"))
				.then( response => {
						if (!response.ok) {
							return rejectOnError(response, uri.toString());
						}

						delete this.findCache[uri];
						return response.json();
					})
				.catch( error => {
					delete this.findCache[uri];

					throw error;
				})
		}

		return this.findCache[uri];
	}

	@shadow
	doUpdate(id, shadowModel, changedProps) {
		const uri = URI(`${id}`).absoluteTo(this.id);
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


StateType.defineType(RestEndpointProperty, spec => {
		spec.autoshadowOff
			.initialState({})
			.readonly;
	});

