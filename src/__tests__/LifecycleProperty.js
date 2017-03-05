import MapProperty from "../MapProperty";


export default class LifecycleProperty extends MapProperty {
	constructor(stateType) {
		super(stateType);

		this.willShadowCount = 0;
		this.didShadowCount = 0;
		this.childInvalidatedCount = 0;
		this.didUpdateCount = 0;
		this.willUnshadowCount = 0;
	}

	propertyWillShadow() { this.willShadowCount++; }

	propertyDidShadow() { this.didShadowCount++; }

	propertyChildInvalidated(childProperty, sourceProperty) { this.childInvalidatedCount++; }

	propertyDidUpdate() { this.didUpdateCount++; }

	propertyWillUnshadow() { this.willUnshadowCount++; }

	checkPropCount(willShadow, didShadow, childInvalicated, didUpdate, willUnshadow) {
		expect(this.willShadowCount).toBe(willShadow);
		expect(this.didShadowCount).toBe(didShadow);
		expect(this.childInvalidatedCount).toBe(childInvalicated);
		expect(this.didUpdateCount).toBe(didUpdate);
		expect(this.willUnshadowCount).toBe(willUnshadow);
	}
}

MapProperty.defineType(LifecycleProperty);
