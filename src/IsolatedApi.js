import { assert } from "akutils";
import isPlainObject from "lodash.isplainobject";

import IsolatedProperty from "./IsolatedProperty";
import reshadow from "./reshadow";
import tick from "./tick";


const _findRecord = Symbol("findRecord");
const _makeRecord = Symbol("makeRecord");

const _records = Symbol("records")
const _store = Symbol("store")
/*
	Questions:
	 	* How integrate with time travel debugging
*/
export default class IsolatedApi {
	constructor(store) {
		this[_store] = store;
		this[_records] = {};
	}

	all(owner) {
		const record = this[_findRecord](owner);

		return record ?record.all() :[];
	}

	count(owner) {
		const record = this[_findRecord](owner);

		return record ?record.count() :0;
	}

	entries(owner) {
		const record = this[_findRecord](owner);

		return record ?record.entries() :{};
	}

	get(key, owner) {
		const record = this[_findRecord](owner);

		return record && record.get(key);
	}

	has(key, owner) {
		const record = this[_findRecord](owner);

		return record && !!record.get(key);
	}

	invalidated(iso) {
		const record = this[_findRecord](iso.owner());

		record && record.invalidated(iso);
	}

	keys(owner) {
		const record = this[_findRecord](owner);

		return record ?record.keys() :[];
	}

	remove(key, owner) {
		const record = this[_findRecord](owner);

		record && record.remove(key);
	}

	removeAllFor(owner) {
		const record = this[_findRecord](owner);

		record && record.removeAll();
	}

	removeOwner(owner) {
		delete this[_records][owner.dotPath()];
	}

	reset() {
		this[_records] = {};
	}

	restore(state) {
		this[_records] = {};

		if (!state) { return }

		const store = this[_store];
		const keys = Object.keys(state);
		const time = tick();
		var key, owner, path, record;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			path = key === "root" ?[] :key.split(".");
			owner = store.findPropertyByPath(path);

			if (!owner) { continue }

			record = this[_records][key] = OwnerRecord.restore(owner, state[key], time);

			record.update();
		}
	}

	serialize() {
		const keys = Object.keys(this[_records]);
		const state = {};
		var key, owner, path;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];

			state[key] = this[_records][key].serialize();
		}

		return state;
	}

	set(key, data, owner, time=tick()) {
		const record = this[_makeRecord](owner);

		record.set(key, data);
	}

	/**
		Invoked by {@link IsolatedObjectShadowImpl#defineChildProperties} to perform updates based
		on processed actions.

		@param {Property} owner - the property managing isolated properties.
	*/
	update(owner) {
		const record = this[_findRecord](owner);

		record && record.update();
	}

	[_findRecord](owner) {
		const records = this[_records];
		var record = records[owner.dotPath()];
		var state;

		// create new record if owner state has keys implying a reset()
		if (!record && owner.isActive() && isPlainObject(state=owner.state()) ) {
			const stateKeys = Object.keys(owner.state());
			const rid = owner.dotPath();

			if (stateKeys.length) {
				record = records[rid] = new OwnerRecord(owner);
			}
		}

		return record;
	}

	[_makeRecord](owner) {
		const records = this[_records];
		const rid = owner.dotPath();

		if (!records[rid]) {
			records[rid] = new OwnerRecord(owner);
		}

		return records[rid];
	}
}


class OwnerRecord {
	constructor(owner) {
		this._owner = owner;
		this._invalidated = false;
		this._kv = { };
		this._nextKv = { };

		// create k/v entries for each existing key
		const state = owner.state();
		const keys = Object.keys(state);
		const time = owner.__().time();
		var key;

		if (keys.length) {
			for (let i=0, len=keys.length; i<len; i++) {
				key = keys[i];

				this.set(key, state[keys], time);
			}

			this.update();
		}
	}

	static restore(owner, state, time) {
		const record = new OwnerRecord(owner);
		const keys = Object.keys(state);
		var key;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];

			record.set(key, state[key], time);
		}

		return record;
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

	keys() {
		return Object.keys(this._kv);
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

	serialize() {
		const kv = this._kv;
		const keys = Object.keys(kv);
		const state = {};
		var iso, key;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			iso = kv[key];
			state[key] = iso.state().data;
		}

		return state;
	}

	set(key, data, time) {
		const owner = this._owner;
		const prevIso = this._kv[key];
		const name = `<iso:${owner.dotPath()}:${key}>`;
		const ownerShader = owner.shader();
		const dataType = ownerShader.typeFor(key, true);
		const isoType = IsolatedProperty.type.properties({ data: dataType });
		const iso = new IsolatedProperty(isoType);

		this._nextKv[key] = { iso, data };

		iso.setKey(key);
		iso.setOwner(owner);
		iso.setStore(owner.store());

		// kill prevIso
		if (prevIso) {
			prevIso.__().blockFurtherUpdates(true);
		}
	}

	update() {
		if (!this._invalidated && Object.keys(this._nextKv).length === 0) { return }

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

		// shadow the new iso properties
		for (let name in nextKv) {
			const next = nextKv[name];
			const { iso: nextIso, data } = next;
//			const nextImpl = nextIso.shader().shadowProperty(time, name, { data });
const state = this._owner.state()[name]
const nextImpl = nextIso.shader().shadowProperty(time, name, state);

// console.log("api update - add", name, state, this._owner.state())
			this._kv[name] = nextIso;
		}

		this._nextKv = {};
		this._invalidated = false;
	}
}


