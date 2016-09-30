import has from "lodash.has";


export default class Access {
	constructor(impl) {
		// invisible property for the internals
		Object.defineProperty(this, '__', { enumerable: true, value: impl })
	}

	get pid() {
		return this.property().pid;
	}

	dotPath() {
		return this.__.dotPath();
	}

	isValid() {
		return this.__.isValid();
	}

	isActive() {
		return this.__.isActive();
	}

	latest() {
		const impl = this.__.latest();

		return impl && impl.shadow();
	}

	merge(data) {
		this.__.merge(data);
	}

	nextState() {
		return this.__.nextState();
	}

	path() {
		return this.__.path();
	}

	property() {
		return this.__.property;
	}

	rootShadow() {
		return this.__.root().shadow();
	}

	slashPath() {
		return this.__.slashPath();
	}

	shadow() {
		return this.__.shadow();
	}

	state() {
		return this.__.state();
	}

	store() {
		return this.__.store();
	}

	/*
		Performs an update on the state values.

		The callback should be pure and have the form:

			callback(nextState) : nextState

				 - or -

			callback(nextState) : { name, nextState }

		The 'nextState' parameter is a javascript object (not a shadow) that represents the next state starting
		from the current state and having all the actions in the current tick applied to it before this update()
		call.

		if the callback returns an object should be:
			name - a stort moniker identifying the update call purpose. This will passed to the store middleware.
				This value is optional with the default value being '[path].$.update()'.
			nextState - the value for the next state after the update functionality
	*/
	update(callback) {
		this.__.update( next => {
			var result = callback(next);

			result = has(result, "nextState") ?result :{ nextState: nexresultt };

			// mark as a replacement (expensive but conservative) since very unlikely a caller through the access
			// variable will have made all the book keeping updates and no way of knowing how deep their changes
			// were in the object hierarchy.
			return {
				name: result.name || `${ this.slashPath() }.$.update()`,
				nextState: result.nextState,
				replace: true
			};
		})
	}

	waitFor(callback) {
		this.store().waitFor( () => {
				const latest = this.latest();

				callback(latest && latest.shadow());
			});
	}
}
