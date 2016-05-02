import isEqual from "lodash.isequal";

import ShadowImpl from "./ShadowImpl";
import PrimitiveShadow from "./PrimitiveShadow";


export default class PrimitiveShadowImpl extends ShadowImpl {
	//------------------------------------------------------------------------------------------------------
	//	Methods that must be implemented by subclasses
	//------------------------------------------------------------------------------------------------------

	defaults(state) {
		if (this.state === undefined) {
			this.assign(state);
		}
	}

	definePropertyGetValue(state) {
		return this.property.definePropertyGetValue(state);
	}

	definePropertySetValue(newValue) {
		this.property.definePropertySetValue(newValue);
	}
	
	isPrimitive() { 
		return true;
	}

	merge(state) {
		if (!isEqual(state, this.state)) {
			this.assign(state);
		}
	}

	shadow() {
		if (!this._shadow) {
			this._shadow = new PrimitiveShadow(this);
		}

		return this._shadow;
	}
}
