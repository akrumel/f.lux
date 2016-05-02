
import Shadow from "./Shadow";


export default class PrimitiveShadow extends Shadow {
	constructor(impl) {
		super(impl)
	}

	valueOf() {
		return this.__.state;
	}
}