import Access from "./Access";


export default class IsolatedAccess extends Access {
	/*
		Sets up a continuous chain of ShadowModelAccess accessors for the model
	*/
	create$ForChild(childImpl) {
		const property = this.property();
		const stateType = property.stateType();
		const AccessCls = stateType.getAccessClass();

		return new AccessCls(childImpl);
	}
}
