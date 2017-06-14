import Symbol from "es6-symbol";


const _impl = Symbol('impl');


/**
	The base class for all shadow state properties. The api is purposefully spartan so as to not polute
	the namespace of shadow state objects. This class does provide implementations for the standard
	javascript methods `toJSON()` and `toString()`. `toJson()` is very useful in the javascript console
	to obtain the actual state being proxied by this shadow state property.

	Each non-primitive shadow state property exposes four special, f.lux specific methods that are
	named so as to be unlikely to collide with normal method names:

	<ul>
		<li>
			`_()` - gets this `Shadow` object. This method may seem superflous but when using
				the `@shadow` decorator this allows property methods to be written to work when invoked
				through the shadow state property or directly using `this` within `Property` methods.
		</li>
		<li>
			`__()` - gets the backing {@link ShadowImpl} instance for this shadow property
		</li>
		<li>
			`$()` - gets the {@link Access} object for obtaining information about a property.
		</li>
		<li>
			`$$()` - gets the {@link Property} managing this shadow state property.
		</li>
	</ul>

	@see {@link ArrayShadow}
	@see {@link IndexedShadow}
	@see {@link MapShadow}
*/
export default class Shadow {
	constructor(impl) {
		this[_impl] = impl;

		// easy debug access to the raw state
		if (process.env.NODE_ENV !== 'production') {
			Object.defineProperty(this, '__state__', { enumerable: false, value: impl.state() });
		}
	}

	/**
		 Gets this `Shadow` object. This method may seem superflous but when using the `@shadow`
		 decorator this allows property methods to be written to work when invoked through the shadow
		 state property or directly using `this` within `Property` methods.

		@return {Shadow}
	*/
	_() {
		return this;
	}

	/**
		Get the backing {@link ShadowImpl} instance for this shadow property.

		@return {ShadowImpl}
	*/
	__() {
		return this[_impl];
	}

	/**
		Gets the {@link Access} object for obtaining information about a property.

		@return {Access}
	*/
	$() {
		return this[_impl].access();
	}

	/**
		Gets the {@link Property} managing this shadow state property.

		@return {Property}
	*/
	$$() {
		return this[_impl].property();
	}

	/**
		Gets the actual state property being proxied by this shadow state property.

		Note: this is the actual state so critical it is not mutated in any way.

		@return {Object|Array}
	*/
	toJSON() {
		return this[_impl].state();
	}

	toString() {
		return JSON.stringify(this);
	}
}

