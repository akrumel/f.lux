import IsolatedObjectShadowImpl from "../IsolatedObjectShadowImpl";
import MapProperty from "../MapProperty";
import Store from "../Store";
import StateType from "../StateType";

import LifecycleProperty from "./LifecycleProperty";


describe("isolated", () => {
	var first0, root, shadow, store;

	beforeEach( () => {
		const rootType = MapProperty.type
				.implementationClass(IsolatedObjectShadowImpl)
				.managedType(LifecycleProperty.type);

		root = new MapProperty(rootType);
		store = new Store(root, {});
		shadow = store._;
		shadow.set("first", { a: 1, b: 2 })

		return store.waitThen()
			.then( () => {
					shadow = store._;
					first0 = shadow.get("first");
				})
	})

	test("attribute assignment", () => {
		first0.a = 2;

		expect(shadow.$().isValid()).toBeFalsy();
		expect(first0.$().isValid()).toBeFalsy();
		first0.$$().checkPropCount(1, 1, 1, 0, 0);

		return store.waitThen()
			.then( () => {
					const newShadow = store.shadow;
					const first = newShadow.get("first");

					expect(first.a).toBe(2);
					first.$$().checkPropCount(1, 1, 1, 1, 0);
			})
	})

	test("clear()", () => {
		shadow.clear();

		return store.waitThen()
			.then( () => {
					const newShadow = store.shadow;
					const first = newShadow.get("first");

					expect(first).toBeUndefined();
					first0.$$().checkPropCount(1, 1, 0, 0, 1);
			})
	})

	test("has()", () => {
		expect(shadow.has("first")).toBeTruthy();
	})

	test("keysArray()", () => {
		expect(shadow.keysArray()).toEqual(expect.arrayContaining([ "first" ]));
	})

	test("remove()", () => {
		shadow.delete("first");

		return store.waitThen()
			.then( () => {
					const newShadow = store.shadow;
					const first = newShadow.get("first");

					expect(first).toBeUndefined();
					first0.$$().checkPropCount(1, 1, 0, 0, 1);
			})
	})

	test("iso replaced", () => {
		first0.$$().checkPropCount(1, 1, 0, 0, 0);
		shadow.set("first", { z: 1 });
		first0.$$().checkPropCount(1, 1, 2, 0, 0);

		return store.waitThen()
			.then( () => {
					const newShadow = store.shadow;
					const first = newShadow.get("first");

					expect(first.z).toBe(1);
					first0.$$().checkPropCount(1, 1, 2, 0, 1);
					first.$$().checkPropCount(1, 1, 0, 0, 0);
			})
	})

	test("set", () => {
		expect(shadow.size).toBe(1);
		expect(first0).toBeTruthy();
		expect(first0.a).toBe(1);

		expect(first0.__().root()).toBe(shadow.__());
		first0.$$().checkPropCount(1, 1, 0, 0, 0);
	})

	test("size()", () => {
		expect(shadow.size).toEqual(1);
	})

	test("delete isolated map", () => {
		const isoType = LifecycleProperty.type
				.implementationClass(IsolatedObjectShadowImpl)
				.initialState(null)
				.managedType(LifecycleProperty.type);
		const rootType = MapProperty.type.properties({ iso: isoType })
		var first0, iso, shadow;

		root = new MapProperty(rootType);
		store = new Store(root, { iso: {} });

		store._.iso.set("first", { a: 1, b: 2 })

		return store.waitThen()
			.then( () => {
					shadow = store._;
					iso = shadow.iso;
					first0 = iso.get("first");

					iso.$$().checkPropCount(1, 1, 0, 1, 0);

					shadow.delete("iso");

					iso.$$().checkPropCount(1, 1, 1, 1, 0);

					return store.waitThen();
				})
			.then( () => {
					iso.$$().checkPropCount(1, 1, 1, 1, 1);
			})
	})
})


