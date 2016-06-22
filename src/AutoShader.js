import invariant from "invariant";
import { isObject } from "akutils";


import noParentStateErrorMsg from "./noParentStateErrorMsg";
import PropertyFactoryShader from "./PropertyFactoryShader";


export default class AutoShader {
	constructor(readonly) {
		this.readonly = readonly;
	}

	shaderFor(name, state) {
		return this;
	}

	shadowProperty(time, name, parentState, parentImpl, store) {
		invariant(parentState, noParentStateErrorMsg(name, parentImpl));
		invariant(parentImpl, "Auto shader properties must have a parent property");

		const state = parentState[name];
		const parentProperty = parentImpl.property;
		var PropertyClass;

		if (Array.isArray(state)) {
			PropertyClass = require("./ArrayProperty").default;
		} else if (isObject(state)) {
			PropertyClass = require("./MapProperty").default;
		} else {
			PropertyClass = require("./PrimitiveProperty").default;
		}

		const shader = new PropertyFactoryShader(PropertyClass, parentProperty, undefined, true, this.readonly);

		return shader.shadowProperty(time, name, parentState, parentImpl);
	}

	shouldAutomount() {
		return this.automount;
	}
}