import has from "lodash.has";

import Symbol from "es6-symbol";


const _impl = Symbol('impl');


/**
	The base class for `Shadow.$()` method used for obtaining f.lux contextual information
	concerning a non-primitive shadow state property.

	The most commonly used methods include:

	<ul>
		<li>{@link Access#dotPath}</li>
		<li>{@link Access#property}</li>
		<li>{@link Access#pid}</li>
		<li>{@link Access#state}</li>
		<li>{@link Access#store}</li>
		<li>{@link Access#waitFor}</li>
	</ul>

	This class provides access to the experimental {@link Property} checkpointing api. Checkpointing
	allows the state to be recorded at a point in time and then later reset to that point. This is
	handy when a form may accept changes and then allow the user to cancel the edit session.

	@see {@link Shadow}
*/
export default class Access {
	constructor(impl) {
		this[_impl] = impl;
	}

	/**
		Get the backing {@link ShadowImpl} instance for this shadow property.

		@return {ShadowImpl}
	*/
	__() {
		return this[_impl];
	}

	/**
		Copies the current actual state for later reset using {@link Property#resetToCheckpoint}. An existing
		checkpoint will take precedence over subsequent calls.
	*/
	checkpoint() {
		this.property().checkpoint();
	}

	/**
		Clears an existing checkpoint created using {@link Property#checkpoint}.
	*/
	clearCheckpoint() {
		this.property().clearCheckpoint();
	}

	/**
		Gets the context from the parent properties. Context is setup for a property using the
		{@link StateType#context} function.
	*/
	context() {
		const ancestors = [];
		var p = this.property();

		while(p=p.parent()) {
			ancestors.unshift(p);
		}

		return ancestors.reduce(
				(ctxt, p) => {
					return p.constructor.type._context
						?{ ...ctxt, ...p.constructor.type._context(p) }
						:ctxt;
				},
				{}
			);
	}

	/**
		Gets the path from root property using a dot (`.`) separator. Suitable for using with the lodash `result()`
		function.

		@return {string} path with each component joined by a `.`

		@see https://lodash.com/docs/4.17.4#result
	*/
	dotPath() {
		return this[_impl].dotPath();
	}

	/**
		Gets the checkpoint state previously recorded using {@link Property#checkpoint}.

		@return {Object|Array} the checkpoint data if checkpoint is set.
	*/
	getCheckpoint() {
		return this.property().getCheckpoint();
	}

	/**
		Gets if an existing checkpoint has be created using {@link Property#checkpoint}.

		@return {boolean} true if a checkpoint has been recorded.
	*/
	hasCheckpoint() {
		return this.property().hasCheckpoint();
	}

	/**
		Gets if the shadow state property is proxying the current actual state contained in the f.lux store.

		@return {boolean} `true` if actively proxying the state.
	*/
	isActive() {
		return this.property().isActive();
	}

	/**
		Gets if the property allows for assignment through the shadow state, ie `todo.desc = "go skiing"`. The
		readonly attribute is hierarchically determined through the parent property if not explicitly set.

		@return {boolean} - true if assignment is not allowed
	*/
	isReadonly() {
		return this.property().isReadonly();
	}

	/**
		Gets if the shadow property has experienced a mutation action. This method will return `true` and
		{@link Access#isActive} may also return true if the f.lux store has not yet been transitioned to
		the next state.

		@return {boolean} `true` if the state has not been changed.
	*/
	isValid() {
		return this[_impl].isValid();
	}

	/**
		Gets the current shadow state for this property. The shadow state referenced by this access object
		could be stale if a javascript closure has a previous reference and then performed an asynchronous
		operation like a network request.

		@return {Shadow}
	*/
	latest() {
		const impl = this[_impl];

		return impl && impl.latest();
	}

	/** @ignore */
	merge(data) {
		this[_impl].merge(data);
	}

	/**
		Gets the next actual state for this property following any pending actions.

		@return {Object|Array}
	*/
	nextState() {
		return this[_impl].nextState();
	}

	/**
		Gets the {@link Property#name} components from the root property to this property.

		@return {[]} array where each name component is either a `string` or `number` depending on the
			each parent component's type.
	*/
	path() {
		return this[_impl].path();
	}

	/**
		Gets the unique f.lux ID for this property.

		@return {number} the id
	*/
	pid() {
		return this.property().pid();
	}

	/**
		Gets the {@link Property} managing this shadow property.

		@return {Property}
	*/
	property() {
		return this[_impl].property();
	}

	/**
		Replaces the current property state with a checkpoint state previously recorded using
		{@link Property#checkpoint}. The checkpoint is cleared.
	*/
	resetToCheckpoint() {
		this.property().resetToCheckpoint();
	}

	/**
		Gets the top-level shadow from the {@link Store} containing this shadow state property.

		@return {Shadow}
	*/
	rootShadow() {
		return this.property().rootShadow();
	}

	/**
		Gets the path from root property using a slash (`/`) separator.

		@return {string} path with each component separated by a `/`
	*/
	slashPath() {
		return this[_impl].slashPath();
	}

	/**

		@return
	*/
	shadow() {
		return this[_impl].shadow();
	}

	/**
		Gets the actual state being shadowed.

		@return {Object|Array}
	*/
	state() {
		return this[_impl].state();
	}

	/**
		Gets the {@Link Store} containing the application state.

		@return {Store}
	*/
	store() {
		return this.property().store();
	}

	/**
		Performs an update on the state values.

		The callback should be pure and have the form:

		```
			callback(nextState) : nextState
		```
		- or -

		```
			callback(nextState) : { name, nextState }
		```

		The `nextState` parameter is a javascript object (not a `Shadow`) that represents the next state starting
		from the current state and having all the actions in the current tick applied to it before this `update()`
		call.

		The callback should return an object with the following properties:
		<ul>
			<li> `name` - a stort moniker identifying the update call purpose. This will passed to the store middleware.
				This value is optional with the default value being '[path].$().update()'.</li>
			<li>`nextState` - the value for the next state after the update functionality.</li>
		</ul>
	*/
	update(callback) {
		this[_impl].update( next => {
			var result = callback(next);

			result = has(result, "nextState") ?result :{ nextState: result };

			// mark as a replacement (expensive but conservative) since very unlikely a caller through the access
			// variable will have made all the book keeping updates and no way of knowing how deep their changes
			// were in the object hierarchy.
			return {
				name: result.name || `${ this.slashPath() }.$().update()`,
				nextState: result.nextState,
				replace: true
			};
		})
	}

	/**
		Registers a **one-time** no argument callback to be invoked after the next {@link Store} state change.

		@param {function(shadow: Shadow)} callback - a callback to be invoked after all pending changes have been
			reflected in the shadow state.
	*/
	waitFor(callback) {
		this.store().waitFor( () => callback && callback(this.latest()) );
	}

	wait() {
		return this.store().wait().then( () => this.latest() );
	}
}
