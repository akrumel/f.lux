
import IndexedShadow from "./IndexedShadow";

export default class ArrayShadow extends IndexedShadow {
	clear() { 
		this.__.clear();
	}


	//------------------------------------------------------------------------------------------------------
	//	Write capable array methods
	//------------------------------------------------------------------------------------------------------
	
	concat(...values) {
		return this.__.concat(...values);
	}

	pop() {
		return this.__.pop();
	}

	push(...values) {
		return this.__.push(...values);
	}

	remove(idx) {
		return this.__.remove(idx);
	}

	removeValue(value) {
		const idx = this.indexOf(value);

		if (idx != -1) {
			this.remove(idx);
		}
	}

	shift() { 
		return this.__.shift();
	}

	splice(start, deleteCount, ...newItems) {
		return this.__.splice(start, deleteCount, ...newItems);
	}

	unshift(...values) {
		return this.__.unshift(...values);
	}
}