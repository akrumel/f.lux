import { isSomething } from "akutils";
import invariant from "invariant";

import AutoShader from "./AutoShader";
import noParentStateErrorMsg from "./noParentStateErrorMsg";
import PropertyFactoryShader from "./PropertyFactoryShader";
import shadowProperty from "./shadowProperty";



const readonlyAutoShader = new AutoShader(true);
const readWriteAutoShader = new AutoShader(false);

/*
	Mappings for property names that always have the same type, such as create_on dates.
*/
const defaultShaders = {};

// Instnace variable names
const _automount = Symbol('_autoMount');
const _automountAll = Symbol('automountAll');
const _autoshadow = Symbol('autoShadow');
const _elementShader = Symbol('elementShader');
const _hasJitProperties = Symbol('hasJitProperties');
const _elementShaderAutomount = Symbol('elementShaderAutomount');
const _property = Symbol('property');
const _shaders = Symbol('shaders');


/*
	Combine with PropertyShader now that everything is a property.
*/
export default class Shader {
	constructor(property) {
		const stateType = property.stateType();

		this[_automount] = [];
		this[_automountAll] = stateType._automountAll;
		this[_autoshadow] = stateType._autoshadow;
		this[_elementShader] = null;
		this[_hasJitProperties] = stateType.hasJitProperties();
		this[_property] = property;
		this[_shaders] = { };
	}

	static addDefault(name, shader) {
		defaultShaders[name] = shader;
	}

	add(name, shader, automount) {
		this[_shaders][name] = shader;

		if (automount) {
			this[_automount].push(name);
		}

		return this;
	}

	automountAll() {
		// leaving implementation for now but automount (experimental feature) is no longer being
		// supported. Keeping in place for a bit to see if needed. (2/2/2017)
		return false;

		//return this[_automountAll];
	}

	addProperty(name, stateType) {
		const property = this[_property];
		const shader = stateType.factory(property);

		this.add(name, shader);
	}

	autoShader() {
		if (this[_autoshadow]) {
			return this[_property].isReadonly() ?readonlyAutoShader :readWriteAutoShader;
		} else {
			return null;
		}
	}

	autoShadow() {
		return this[_autoshadow];
	}

	elementShader() {
		return this[_elementShader];
	}

	get(name) {
		return this[_shaders][name];
	}

	has(name) {
		return !!this[_shaders][name];
	}

	isAutomount(name) {
		// leaving implementation for now but automount (experimental feature) is no longer being
		// supported. Keeping in place for a bit to see if needed. (2/2/2017)
		return false;

		// if (this[_automountAll]) {
		// 	return true;
		// } else if (this[_shaders][name]) {
		// 	return this[_shaders][name].shouldAutomount() || this[_automount].indexOf(name) !== -1;
		// } else if (this[_elementShader]) {
		// 	return this[_elementShaderAutomount] || this[_elementShader].shouldAutomount();
		// } else {
		// 	return false;
		// }
	}

	property() {
		return this[_property];
	}

	remove(name) {
		delete this[_shaders][name];

		// remove the automount setting
		const automountIdx = this[_automount].indexOf(name);

		if (automountIdx != -1) {
			this[_automount].splice(automountIdx, 1);
		}

		return this;
	}

	setAutomountAll(automount) {
		this[_automountAll] = automount;
	}

	setAutoshadow(value) {
		this[_autoshadow] = !!value;

		return this;
	}

	setElementType(stateType) {
		const property = this[_property];
		const shader = stateType.factory(property);

		return this.setElementShader(shader);
	}

	setElementShader(shader, automount) {
		if (this[_elementShader]) {
			console.warn(`Property already has a child shader set - ignoring setElementShader() call - shader=%O`, this);
			return;
		}

		this[_elementShader] = shader;
		this[_elementShaderAutomount] = automount;

		return this;
	}

	/*
		Gets the shader for a child property. This method returns the first shader generated by checking:
			1) shaders registered using add() or addPropertyClass() - named shaders
			2) jit shaders from state type
			3) child shader (registered using setElementShader() )
			4) default shaders (regustered using the static addDefault() method)
			5) auto shader (applicable if autoShadow set to true)

		Parameters:
			name - the name of the child property
			sate - the property's current state (not the child state)
	*/
	shaderFor(name, state) {
		// priority order: named, child, default mapping, auto shading
		return this[_shaders][name] ||
			(this[_hasJitProperties] && this.stateType().jitShaderFor(name, state, this[_property])) ||
			this[_elementShader] ||
			defaultShaders[name] ||
			this.autoShader();
	}

	/*
		Creates the proxy (shadow) for a state property.
	*/
	shadowProperty(time, name, parentState, parentImpl) {
		const property = this[_property];
		const isRoot = property.isRoot();

		invariant(parentState || isRoot, noParentStateErrorMsg(name, parentImpl));

		// get the initial state for the property
		const currState = isRoot ?parentState :parentState[name];
		const state = property.getInitialState(currState);

// if (name === 0) debugger
		if (!isRoot) {
			parentState[name] = state;
		}

		// add mixins to the property (but only once)
		if (!property.__hasMixins()) {
			let proto = Object.getPrototypeOf(property);
			let mixins = proto.constructor.mixins;
			let mixin;

			if (mixins) {
				for (let i=0, len=mixins.length; i<len; i++) {
					mixin = mixins[i](property);

					property.__addMixin(mixin);
				}
			}
		}

		// create the backing implementation instance
		const ImplClass = property.implementationClass();
		const impl = shadowProperty(time, ImplClass, property, name, state, parentImpl, this);

		return impl;
	}

	shadowUndefinedProperties(state, impl, define) {
		const keys = Object.keys(this[_shaders]);
		const shadow = impl.shadow();
		const propNames = Object.getOwnPropertyNames(shadow);
		var key, shader;

		for (let i=0, len=keys.length; i<len; i++) {
			key = keys[i];
			shader = this[_shaders][key];

			if (propNames.indexOf(key) !== -1) { continue }

			define(key, shader);
		}
	}

	/*
		Automounting is an experimental, partially implemented feature.
	*/
	shouldAutomount() {
		const proto = Object.getPrototypeOf(this[_property]);

		return proto.constructor.shouldAutomount && proto.constructor.shouldAutomount();
	}

	stateType() {
		return this[_property].stateType();
	}
}


