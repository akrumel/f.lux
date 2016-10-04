import Access from "../Access";
import ShadowModelAccess from "./ShadowModelAccess";


export default class ModelAccess extends Access {
	/*
		Sets up a continuous chain of ShadowModelAccess accessors for the model
	*/
	create$ForChild(childImpl) {
		if (childImpl.name() == "data") {
			return new ShadowModelAccess(this.property(), childImpl);
		} else {
			return new Access(childImpl);
		}
	}
}
