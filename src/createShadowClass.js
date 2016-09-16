import { Shadow } from "f.lux";

export default function createShadowClass(shadowSpec) {
	class CustomShadow extends Shadow { }

	var proto = CustomShadow.prototype;
	var names = Object.getOwnPropertyNames(shadowSpec);
	var name, desc;

	for (let i=0, len=names.length; i<len; i++) {
		name = names[i];
		desc = Object.getOwnPropertyDescriptor(shadowSpec, name);

		Object.defineProperty(proto, name, desc);
	}

	return CustomShadow;
}
