import ObjectShadowImpl from "./ObjectShadowImpl";


export default class IsolatedShadowImpl extends ObjectShadowImpl {
	//------------------------------------------------------------------------------------------------------
	// ShadowImpl class overrides - the tricky ones
	//
	// Developer Note: Use great caution when overriding these methods as not their original intent
	//------------------------------------------------------------------------------------------------------

	isRoot() {
		return false;
	}

	obsolete(callback) {
		this.store().isolated().obsolete(this.property());

		super.obsolete(callback);
	}
}