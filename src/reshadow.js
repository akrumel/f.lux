

export default function reshadow(time, parentState, prevImpl, parentImpl) {
	const state = prevImpl.isRoot() ?parentState :parentState[prevImpl.name];
	const prevProperty = prevImpl.property && prevImpl.property;

	// handle cases where node did not actually change
	if (prevImpl.isValid()) {
		// No values changed in prevImpl tree so just change parent and roots of decendants
		// This case should only occur for non-root properties but no harm if so
		if (parentImpl) {
			prevImpl.changeParent(parentImpl);
		}

		return prevImpl;
	} else if (!prevImpl.replaced()) {
		// Invalid because a descendant property changed or a partial change property. Create a
		// copy so can keep valid properties while shadowing invalid/new properties
		const impl = prevImpl.createCopy(time, state, parentImpl);

		// Attach the new property to its parents and invoke property end update life-cycle method
		impl.setupPropertyAccess();

		// Set the properties implmentation after attaching the implementation to the shadow state
		prevImpl.property.setImpl(impl);

		// mark previous implementation dead after new implementation in place so property can querey
		// the previous implementation during the life-cycle change and it will read active (not dead).
		prevImpl.updated();

		return impl;
	}

	const shader = prevImpl.shader(state);

	// make an all new shadow model
	prevImpl.obsoleteTree();

	if (prevImpl.isRoot()) {
		const rootProperty = prevImpl.property;

		return rootProperty.shader(parentState).shadowProperty(time, name, parentState);
	} else {
		return shader.shadowProperty(time, prevImpl.nextName(), parentState, parentImpl, parentImpl.store);
	}
}
