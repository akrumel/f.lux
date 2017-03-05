import MapProperty from "../MapProperty";
import Store from "../Store";


describe("MapShadow", () => {
	var root, shadow, store;

	beforeEach( () => {
		root = new MapProperty();
		store = new Store(root, { a: 1, b: 2 });
		shadow = store._;
	})

	test("clear()", () => {
		shadow.clear();

		expect(Object.keys(shadow.$().nextState()).length).toBe(0);

		return store.waitThen()
			.then( () => {
				expect(store.shadow.size).toBe(0);
			})
	})

	test("delete()", () => {
		shadow.delete("a");

		expect(Object.keys(shadow.$().nextState()).length).toBe(1);

		return store.waitThen()
			.then( () => {
				expect(store.shadow.size).toBe(1);
			})
	})

	test("delete() bad key", () => {
		shadow.delete("badKey");

		expect(Object.keys(shadow.$().nextState()).length).toBe(2);

		return store.waitThen()
			.then( () => {
				expect(store.shadow.size).toBe(2);
			})
	})

	test("get()", () => {
		expect(shadow.get("a")).toBe(1);
	})

	test("has()", () => {
		expect(shadow.has("a")).toBeTruthy;
		expect(shadow.has("b")).toBeTruthy;
		expect(shadow.has("badKey")).toBeFalsy;
	})

	test("keys()", () => {
		const expected = ["a", "b"];
		const found = [];

		for (let key of shadow.keysArray()) {
			found.push(key);
			expect(expected).toContain(key);
		}

		expect(found).toHaveLength(expected.length);
	})

	test("keysArray()", () => {
		const expected = ["a", "b"];

		expect(shadow.keysArray()).toEqual(expect.arrayContaining(expected));
	})

	test("size", () => {
		expect(shadow.size).toBe(2);
	})

	test("values()", () => {
		const expected = [1, 2];
		const found = [];

		for (let key of shadow.values()) {
			found.push(key);
			expect(expected).toContain(key);
		}

		expect(found).toHaveLength(expected.length);
	})

	test("valuesArray()", () => {
		const expected = [1, 2];

		expect(shadow.valuesArray()).toEqual(expect.arrayContaining(expected));
	})

	test("dot access", () => {
		expect(shadow.a).toBe(1);
	})
})
