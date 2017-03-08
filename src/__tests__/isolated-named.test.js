import IsolatedObjectShadowImpl from "../IsolatedObjectShadowImpl";
import MapProperty from "../MapProperty";
import Store from "../Store";
import StateType from "../StateType";

import LifecycleProperty from "./LifecycleProperty";


describe("isolated named properties", () => {
	var root, shadow, store;

	beforeEach( () => {
		const rootType = MapProperty.type
				.isolated
				.managedType(LifecycleProperty.type)
				.properties({ info: MapProperty.type });

		root = new MapProperty(rootType);
		store = new Store(root);
		shadow = store._;
	})

	test("initial state", () => {
		expect(store.state).toEqual({});
		expect(shadow.get("info")).toBeDefined();
	})
})