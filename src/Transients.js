import {
	assert,
	doneIterator,
	iteratorFor,
	iterateOver,
} from "akutils";

import ObjectProperty from "./ObjectProperty";
import Shadow from "./Shadow";
import StateType from "./StateType";
import TransientProperty from "./TransientProperty";

import appDebug, { TransientKey as DebugKey } from "./debug";
const debug = appDebug(DebugKey);


/*

*/
export class TransientsShadow extends Shadow {
	get size() {
		return this.__().size();
	}

	clear() {
		this.__().clear();
	}

	delete(id) {
		this.$$()._keyed.removeProperty(id);
	}

	entries() {
		return iterateOver(this.__().keys(), key => [ key, this[key] ] );
	}

	has(id) {
		return this.__().has(id);
	}

	keys() {
		return iteratorFor(this.__().keys());
	}

	set(id, property) {
		assert( a => a.is(id, "id must be specifeid for setting a transient property") );

		var trans = new TransientProperty(id, property);

		this.$$()._keyed.addProperty(id, trans);

		return trans;
	}

	sweep() {
		const property = this.$$();
		const keys = property._keyed.keysArray();

		for (let i=0, t; t=this[keys[i]]; i++) {
			if (!t.isLocked()) {
				this.delete(keys[i]);
			}
		}
	}

	values() {
		return iterateOver(this.__().keys(), key => this[key]);
	}

	[Symbol.iterator]() { return this.entries() }
}

export default class TransientsProperty extends ObjectProperty {
	constructor(id, property) {
		super();

		this.setShadowClass(TransientsShadow);
	}
}


TransientsProperty.stateSpec = new StateType(TransientsProperty)
	.initialState({})
	.autoshadowOff
	.readonly
	.typeName("TransientsProperty");

