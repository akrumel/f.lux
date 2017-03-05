import ObjectProperty from "../ObjectProperty";
import Store from "../Store";
import StateType from "../StateType";

import LifecycleProperty from "./LifecycleProperty";


describe("life-cycle", () => {
	var root, shadow, store;

	beforeEach( () => {
		const rootType = StateType.create(ObjectProperty).elementType(LifecycleProperty.type);
		const state = {
				first: { a: 1, b: 2 },
				second: { a: 1, b: 2}
			}

		root = new LifecycleProperty(rootType);
		store = new Store(root, state);
		shadow = store._;
	})

	test("willShadow", () => {
		const firstProp = store.shadow.first.$$();

		root.checkPropCount(1, 1, 0, 0, 0);
		firstProp.checkPropCount(1, 1, 0, 0, 0);
	})

	test("single update", () => {
		shadow.first.a = 2;

		return store.waitThen()
			.then( () => {
					const firstProp = store.shadow.first.$$();

					expect(store.shadow.first.a).toBe(2);
					root.checkPropCount(1, 1, 1, 1, 0);
					firstProp.checkPropCount(1, 1, 1, 1, 0);
				});
	})

	test("multiple updates same leaf", () => {
		shadow.first.a = 2;
		shadow.first.a = 3;

		return store.waitThen()
			.then( () => {
					const firstProp = store.shadow.first.$$();

					expect(store.shadow.first.a).toBe(3);
					root.checkPropCount(1, 1, 1, 1, 0);
					firstProp.checkPropCount(1, 1, 1, 1, 0);
				});
	})

	test("shadow.first = { z: 1 }", () => {
		const first0 = store.shadow.first.$$();
		const first0Impl = first0.__();

		shadow.first = { z: 1 };
		shadow.first = { z: 2 };

		expect(first0Impl.isActive()).toBeTruthy();
		expect(first0Impl.isValid()).toBeFalsy();
		expect(first0Impl.replaced()).toBeTruthy();

		return store.waitThen()
			.then( () => {
					const firstProp = store.shadow.first.$$();
					const firstImpl = firstProp.__();

					expect(first0Impl.isActive()).toBeFalsy();
					expect(first0Impl.isValid()).toBeFalsy();
					expect(first0Impl.replaced()).toBeTruthy();

					expect(firstImpl.isActive()).toBeTruthy();
					expect(firstImpl.isValid()).toBeTruthy();
					expect(firstImpl.replaced()).toBeFalsy();

					expect(firstProp._().z).toBe(2);
					expect(first0===firstProp).toBeFalsy();
					root.checkPropCount(1, 1, 1, 1, 0);
					first0.checkPropCount(1, 1, 2, 0, 1);
					firstProp.checkPropCount(1, 1, 0, 0, 0);
				});
	})
})