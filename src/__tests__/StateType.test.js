import StateType, { isKeyedPrototype } from "../StateType";
import CollectionProperty from "../collection/CollectionProperty";
import MapProperty from "../MapProperty";
import ObjectProperty from "../ObjectProperty";
import TransientsProperty from "../TransientsProperty";
import TransientProperty from "../TransientProperty";


describe("StateType", () => {
	test("isKeyedPrototype", () => {
		const CustomCollectionProperty = CollectionProperty.createClass();
		const CustomMapProperty = MapProperty.createClass();
		const CustomObjectProperty = ObjectProperty.createClass();

		expect(isKeyedPrototype(CollectionProperty)).toBeTruthy();
		expect(isKeyedPrototype(CustomCollectionProperty)).toBeTruthy();
		expect(isKeyedPrototype(CustomMapProperty)).toBeTruthy();
		expect(isKeyedPrototype(CustomObjectProperty)).toBeTruthy();
		expect(isKeyedPrototype(MapProperty)).toBeTruthy();
		expect(isKeyedPrototype(ObjectProperty)).toBeTruthy();
		expect(isKeyedPrototype(TransientsProperty)).toBeTruthy();
		expect(isKeyedPrototype(TransientProperty)).toBeTruthy();
	})
})