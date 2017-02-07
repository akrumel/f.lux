
/** @ignore */
export default function createObject(ctor) {
	var factoryFunction = ctor.bind.apply(ctor, arguments);

	return new factoryFunction();
}
