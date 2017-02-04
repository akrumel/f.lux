import isEqual from "lodash.isequal";

import ShadowImpl from "./ShadowImpl";


export default class PrimitiveShadowImpl extends ShadowImpl {
	//------------------------------------------------------------------------------------------------------
	//	Methods that must be implemented by subclasses
	//------------------------------------------------------------------------------------------------------

	defaults(state) {
		if (this.state() === undefined) {
			this.assign(state);
		}
	}

	merge(state) {
		if (!isEqual(state, this.state())) {
			this.assign(state);
		}
	}


	//------------------------------------------------------------------------------------------------------
	//	Methods with base implementations that subclasses may need to override - no need to call super
	//------------------------------------------------------------------------------------------------------

	definePropertyGetValue(state) {
		return this.property().definePropertyGetValue(state);
	}

	definePropertySetValue(newValue) {
		this.property().definePropertySetValue(newValue);
	}

	isPrimitive() {
		return true;
	}
}
