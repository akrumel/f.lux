
import noParentStateErrorMsg from "./noParentStateErrorMsg";
import Property from "./Property";
import Shader from "./Shader";

import {
	assert,
	isSomething,
} from "akutils";


export default class PropertyFactoryShader {
	/*
		Creates a factory that will create a shader for instantiating shadow properties for a property type.

		Parameters:
			stateType - StateType instance describing the property
			parent - the parent Property instance
	*/
	constructor(stateType, parent) {
		this.stateType = stateType;
		this.parent = parent;
	}

	setElementType(stateType) {
		// ignoring since assuming set in StateType._setupShader() and also contained in the stateType var
		this.elementType = stateType;
	}

	addProperty(name, stateType) {
		if (!this.propertyShaderDefn) {
			this.propertyShaderDefn = { };
		}

		this.propertyShaderDefn[name] = stateType;
	}

	shadowProperty(time, name, parentState, parentImpl) {
		assert( a => a.is(parentState || !this.parent, noParentStateErrorMsg(name, parentImpl)) );

		// this should never happen but lets be safe
		if (!isSomething(parentState)) {
			console.warn(this.noParentStateErrorMsg(name, parentImpl));

			return null;
		}

		const property = this.stateType.createProperty();
		const shader = property.shader();

		// set the proprety's parent property
		property.setParent(this.parent);

		this._configureShader(shader);

		return shader.shadowProperty(time, name, parentState, parentImpl);
	}

	shouldAutomount() {
		const PropertyClass = this.stateType._PropertyClass;

		return PropertyClass.constructor.shouldAutomount && PropertyClass.constructor.shouldAutomount();
	}

	_configureShader(shader) {
		const propertyShaderDefn = this.propertyShaderDefn;

		if (!propertyShaderDefn) { return }

		const keys = Object.keys(propertyShaderDefn);
		var key, type;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			type = propertyShaderDefn[key];

			shader.addProperty(key, type);
		}
	}
}

