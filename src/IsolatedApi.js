import { assert } from "akutils";

import IsolatedProperty from "./IsolatedProperty";
import reshadow from "./reshadow";

/*
	Questions:
	 	* How integrate with time travel debugging
*/
export default class IsolatedApi {
	constructor(store) {
		this.store = store;
		this.records = {};
	}

	all(owner) {
		const record = this._record(owner);

		return record.all();
	}

	count(owner) {
		const record = this._record(owner);

		return record.count();
	}

	entries(owner) {
		const record = this._record(owner);

		return record.entries();
	}

	get(key, owner) {
		const record = this._record(owner);

		return record && record.get(key);
	}

	invalidated(iso) {
		const record = this._record(iso.owner());

		record.invalidated(iso);
	}

	obsolete(iso) {
		const owner = iso.owner();
		const record = this._findRecord(owner);

		record && record.obsolete(iso);
	}

	remove(key, owner) {
		const record = this._record(owner);

		record && record.remove(key);
	}

	removeAllFor(owner) {
		const record = this._record(owner);

		record && record.removeAll();
	}

	set(key, isoType, owner) {
		const record = this._record(owner);

		assert( a => a.is(isoType.getManagedType(), "Managed type required for isolated objects") );

		record.set(key, isoType);
	}

	/**
		Invoked by {@link IsolatedObjectShadowImpl#defineChildProperties} to perform updates based
		on processed actions.

		@param {Property} owner - the property managing isolated properties.
	*/
	update(owner) {
		const record = this._record(owner);

		record && record.update();
	}

	willUnshadow(iso) {
		const record = this._record(iso.owner());

		record.willUnshadow(iso);
	}

	_findRecord(owner) {
		return this.records[owner.pid()];
	}

	_record(owner) {
		const records = this.records;
		const pid = owner.pid();

		if (!records[pid]) {
			records[pid] = new OwnerRecord(this, owner);
		}

		return records[pid];
	}
}


class OwnerRecord {
	constructor(api, owner) {
		this._owner = owner;
		this._invalidated = false;
		this._kv = { };
		this._nextKv = { };
	}

	all() {
		return Object.values(this._kv);
	}

	count() {
		return Object.keys(this._kv).length;
	}

	entries() {
		return { ...this._kv }
	}

	get(key) {
		return this._kv[key];
	}

	invalidated(iso) {
		this._invalidated = true;
	}

	obsolete(iso) {

	}

	remove(key) {
		const iso = this._kv[key];
		const impl = iso && iso.__();

		if (impl) {
			impl.invalidate()
			impl.obsoleteTree();
			impl.blockFurtherUpdates(false);
		}
	}

	removeAll() {
		const kv = this._kv;

		for (let key in kv) {
			this.remove(key);
		}
	}

	set(key, isoType) {
		const owner = this._owner;
		const prevIso = this._kv[key];
		const name = `<iso:${owner.dotPath()}:${key}>`;

		// create and record the new isolated property
		const iso = this._nextKv[key] = new IsolatedProperty(isoType);

		iso.setKey(key);
		iso.setOwner(owner);
		iso.setStore(owner.store());

		// kill prevIso
		if (prevIso) {
			prevIso.__().blockFurtherUpdates(true);
		}
	}

	update() {
		if (!this.invalidated && this._died.length === 0) { return }

		const kv = this._kv;
		const nextKv = this._nextKv;
		const time = this._owner.__().time();
		var iso, impl;

		// resahdow live properties
		for (let name in kv) {
			iso = kv[name];
			impl = iso.__();

			if (impl.replaced() || !impl.isActive()) {
				impl.obsoleteTree();
				delete kv[name];
			} else if (!impl.isValid()) {
				impl.willShadow(false);

				reshadow(time, impl.nextState(), impl);
			}
		}

		// shadow the new iso properties (not replacements)
		for (let name in nextKv) {
			const nextIso = nextKv[name];
			const state = nextIso.initialState();
			const nextImpl = nextIso.shader().shadowProperty(time, name, state);

			this._kv[name] = nextIso;
		}

		this._nextKv = {};
		this._invalidated = false;
	}

	willUnshadow(iso) {

	}
}


