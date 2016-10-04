import has from "lodash.has";

const _impl = Symbol('impl');

export default class Access {
	constructor(impl) {
		this[_impl] = impl;
	}

	get pid() {
		return this.property().pid;
	}

	__() {
		return this[_impl];
	}

	dotPath() {
		return this[_impl].dotPath();
	}

	isActive() {
		return this[_impl].isActive();
	}

	isValid() {
		return this[_impl].isValid();
	}

	isReadonly() {
		return this.property().readonly;
	}

	latest() {
		const impl = this[_impl].latest();

		return impl && impl.shadow();
	}

	merge(data) {
		this[_impl].merge(data);
	}

	nextState() {
		return this[_impl].nextState();
	}

	path() {
		return this[_impl].path();
	}

	property() {
		return this[_impl].property;
	}

	rootShadow() {
		return this[_impl].root().shadow();
	}

	slashPath() {
		return this[_impl].slashPath();
	}

	shadow() {
		return this[_impl].shadow();
	}

	state() {
		return this[_impl].state();
	}

	store() {
		return this[_impl].store();
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
		this[_impl].update( next => {
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
