
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
			PropertyClass - the Property subclass's class
			parent - the parent Property instance (not ShadowImpl subclass)
	*/
	constructor(stateType, parent) {
		this.stateType = stateType;
		this.parent = parent;
	}

	setElementType(stateType) {
		this.childShaderDefn = stateType;
	}

	addPropertyClass(name, PropertyClass, stateType=PropertyClass.stateSpec) {
		if (!this.propertyShaderDefn) {
			this.propertyShaderDefn = { };
		}

		this.propertyShaderDefn[name] = { PropertyClass, stateType: stateType };
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

		return shader.shadowProperty(time, name, parentState, parentImpl);
	}

	shouldAutomount() {
		return this.PropertyClass.constructor.shouldAutomount && this.PropertyClass.constructor.shouldAutomount();
	}
}

