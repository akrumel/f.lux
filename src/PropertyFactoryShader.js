
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
	constructor(PropertyClass, parent, initialState, autoShadow, readonly) {
		assert( a => a.is(Property.isPrototypeOf(PropertyClass), "PropertyClass must be a subclass of Property") );

		this.PropertyClass = PropertyClass;
		this.parent = parent;
		this.initialState = initialState;
		this.autoShadow = autoShadow;
		this.readonly = readonly;
	}

	setElementClass(PropertyClass, initialState, autoShadow, readonly) {
		this.childShaderDefn = {
				PropertyClass: PropertyClass,
				initialState: initialState,
				autoShadow: autoShadow,
				readonly: readonly,
			};
	}

	setElementStateType(stateType) {
		this.childShaderDefn = stateType;
	}

	addPropertyClass(name, PropertyClass, initialState, autoShadow, readonly) {
		if (!this.propertyShaderDefn) {
			this.propertyShaderDefn = { };
		}

		this.propertyShaderDefn[name] = {
				PropertyClass: PropertyClass,
				initialState: initialState,
				autoShadow: autoShadow,
				readonly: readonly,
			};
	}

	addStateType(name, stateType) {
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

		const stateSpec = this.PropertyClass.stateSpec;
		var property, shader;

		// setup the shader and set on property
		if (stateSpec) {
			property = stateSpec.createProperty();
			shader = property.shader();
		} else {
			// old school method of hand configuring the factory shaders
			property = new this.PropertyClass(this.initialState, this.autoShadow);
			shader = property.shader();

			this._configureShader(shader, property);

			// setup the readonly flag
			if (this.readonly) {
				property.setReadonly(true);
			}
		}

		// set the proprety's parent property
		property.setParent(this.parent);

		return shader.shadowProperty(time, name, parentState, parentImpl);
	}

	shouldAutomount() {
		return this.PropertyClass.constructor.shouldAutomount && this.PropertyClass.constructor.shouldAutomount();
	}

	_configureShader(shader, property) {
		const { StateType } = require("./StateTypes");

//		configureShaderFromStateTypes(property, shader);

		if (this.childShaderDefn) {
			if (this.childShaderDefn instanceof StateType) {
				shader.setElementShader(this.childShaderDefn.factory(property));
			} else {
				let { PropertyClass, initialState, autoShadow, readonly } = this.childShaderDefn;

				shader.setElementClass(PropertyClass, initialState, autoShadow, readonly || this.readonly);
			}
		} else if (this.propertyShaderDefn) {
			let keys = Object.keys(this.propertyShaderDefn);

			for (let i=0, len=keys.length; i<len; i++) {
				let key = keys[i];
				let defn = this.propertyShaderDefn[key];

				if (defn instanceof StateType) {
					shader.add(key, defn.factory(property));
				} else {
					let { PropertyClass, initialState, autoShadow, readonly } = defn;

					shader.addPropertyClass(key, PropertyClass, initialState, autoShadow, readonly || this.readonly);
				}
			}
		}
	}
}


/*
	Obsolete - leaving for now to ensure no longer needed
*/
export function configureShaderFromStateTypes(property, shader) {
	const { StateType } = require("./StateTypes");
	var proto = property;
	var spec;

	// walk the prototype chain looking for ctor.stateSpec properties
	while(proto = Object.getPrototypeOf(proto)) {
		// check if stateSpec variable defined for Property type
		if (!proto.constructor.stateSpec) { continue }

		spec = proto.constructor.stateSpec;

		if (spec instanceof StateType) {
			spec.configureShader(shader);
		} else {
			// iterate keys and add data types
			for(let key in spec) {
				shader.add(key, spec[key].factory(property));
			}
		}
	}
}
