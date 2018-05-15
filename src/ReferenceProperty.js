import { assert } from "akutils";
import ObjectProperty from "./ObjectProperty";
import PrimitiveProperty from "./PrimitiveProperty";
import Shadow from "./Shadow";
import StateType from "./StateType";

import appDebug, { ReferenceKey as DebugKey } from "./debug";
const debug = appDebug(DebugKey);


const _desc = Symbol('desc');
const _lockId = Symbol('lockId');
const _locks = Symbol('locks');
const _path = 'path';
const _refProp = Symbol('ref');
const _store = Symbol('store');

var nextLockId = 1;


export class ReferenceLock {
	constructor(id, desc, refProp) {
		this[_lockId] = id;
		this[_desc] = desc;
		this[_refProp] = refProp;
	}

	desc() {
		return this[_desc];
	}

	id() {
		return this[_lockId];
	}

	is(desc) {
		return this[_desc] === desc;
	}

	release() {
		this[_refProp]._removeLock(this);
	}
}

export class ReferenceShadow extends Shadow {
	data() {
		return this.$$().data();
	}

	isLocked() {
		return this.$$().isLocked();
	}

	lock(desc) {
		return this.$$().lock(desc);
	}

	referenceTo(shadow) {
		this.$$().referenceTo(shadow);
	}
}


export default class ReferenceProperty extends ObjectProperty {
	constructor() {
		super();

		// this.setShadowClass(ReferenceShadow);
		this[_locks] = [];
	}

	propertyWillUnshadow() {
		if (this.isLocked()) {
			this.store().removeListener(this);
		}

		delete this[_locks];
	}

	data() {
		const path = this.path();

		if (!path) {
			return null;
		}

		return this.ref || this.store().findByPath(path);
	}

	isLocked() {
		return this[_locks] && this[_locks].length > 0;
	}

	lock(desc=`lock:${nextLockId}`) {
		return this._addLock(new ReferenceLock(nextLockId++, desc, this));
	}

	/**
		Store listener callback handler.
	*/
	onPostUpdate() {
		const path = this.path();
		const curr = path ?this.store().findByPath(path) :null;

		if (curr !== this.ref) {
			this.ref = curr;
			this.touch();
		}
	}

	path() {
		return this._keyed.get(_path);
	}

	referenceTo(shadow) {
		if (this.isLocked()) {
			console.warn("Reference is locked and changing path");
		}

		this._keyed.set(_path, shadow ?shadow.$().path() :null);
	}

	_addLock(lock) {
		assert( a => a.is(lock[_refProp] === this, "Lock reference object mismatch") );

		if (!this[_locks]) { return null }

		this[_locks].push(lock);
		debug( d => d(`_addLock(): path=${ this.path() }, desc=${ lock.desc() }`) );

		if (this[_locks].length === 1) {
			const path = this.path();

			this.store().addListener(this);
			this.ref = path ?this.store().findByPath(this.path()) :null;
		}

		return lock;
	}

	_removeLock(lock) {
		if (!this[_locks]) { return }

		this[_locks] = this[_locks].filter( l => l !== lock );
		debug( d => d(`_removeLock(): id=${ this.path() }, locked=${ this.isLocked() }, desc=${ lock.desc() }`) );

		if (this[_locks].length === 0) {
			this.store().removeListener(this);
			this.ref = null;
		}
	}
}


StateType.defineType(ReferenceProperty, spec => {
	spec.initialState({})
		.properties({
				[_path]: PrimitiveProperty.type.initialState(null),
			})
			.shadowClass(ReferenceShadow)
			.typeName("ReferenceProperty")
});

