import { assert } from "akutils";

import createShadowClass from "./createShadowClass";
import ObjectProperty from "./ObjectProperty";
import PrimitiveProperty from "./PrimitiveProperty";
import SimpleShadow from "./SimpleShadow";

import appDebug, { TransientKey as DebugKey } from "./debug";
const debug = appDebug(DebugKey);


const _data = "data";
const _desc = Symbol('desc');
const _id = "id";
const _lockId = Symbol('lockId');
const _locks = Symbol('locks');
const _subscribers = Symbol('subscribers');
const _trans = Symbol('trans');
const _transId = Symbol('id');
//const PrimaryLockName = "__primary__";

var nextLockId = 1;


export class TransientLock {
	constructor(id, desc, trans) {
		this[_lockId] = id;
		this[_desc] = desc;
		this[_trans] = trans;
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
		this[_trans]._removeLock(this);
	}

	trans() {
		return this[_trans];
	}
}


export class TransientShadow extends SimpleShadow {
	// get primaryLock() {
	// 	return this.$$().primaryLock();
	// }

	delete() {
		const transRoot = this.$$().parent._();

		transRoot.delete(this.id);
	}

	isLocked() {
		return this.$$().isLocked();
	}

	lock(desc) {
		return this.$$().lock(desc);
	}

	/*
		Releases the primary lock. Convenience method so the lock does not have to be independently
		managed when a transient object has a single consumer, such as react component.
	*/
	// release() {
	// 	this.$$().release();
	// }
}

/*

*/
export default class TransientProperty extends ObjectProperty {
	constructor(id, property) {
		super({}, false, true);

		this._keyed.addProperty(_data, property);
		this._keyed.addProperty(_id,  new PrimitiveProperty(id, false, true));

		this.setShadowClass(TransientShadow);
		this[_transId] = id;
		this[_locks] = [];

		// create the primary lock (ensures transient is locked before first sweep)
//		this.lock(PrimaryLockName);

		debug( d => d(`TransientProperty created: id=${ id }`) );
	}

	get id() {
		return this[_transId];
	}

	propertyWillUnshadow() {
		delete this[_locks];

		debug( d => d(`propertyWillUnshadow(): id=${ this[_transId] }`) );
	}

	isLocked() {
		return this[_locks] && this[_locks].length > 0;
	}

	lock(desc=`lock:${nextLockId}`) {
		return this._addLock(new TransientLock(nextLockId++, desc, this));
	}

	// primaryLock() {
	// 	return this[_locks] && this[_locks].find( l => l.is(PrimaryLockName) );
	// }

	// release() {
	// 	const primary = this.primaryLock();

	// 	primary && primary.release();
	// }

	_removeLock(lock) {
		if (!this[_locks]) { return }

		this[_locks] = this[_locks].filter( l => l !== lock );
		debug( d => d(`_removeLock(): id=${ this[_transId] }, locked=${ this.isLocked() }, desc=${ lock.desc() }`) );
	}

	_addLock(lock) {
		assert( a => a.is(lock.trans() === this, "Lock transient object mismatch") );

		if (!this[_locks]) { return null }

		this[_locks].push(lock);
		debug( d => d(`_addLock(): id=${ this[_transId] }, desc=${ lock.desc() }`) );

		return lock;
	}
}




