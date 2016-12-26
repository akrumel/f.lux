import {
	ObjectProperty,
	StateType,
} from "f.lux";

/*
	@shadow and @shadowBound decorators mark es2015 properties (get/set) and methods to be exposed on the
	shadow state. Their behavior differs on what the 'this' reference is:
		@shadow - this points to the shadow state. Access the Property subclass using this.$$.
			'this' and 'this._' reference to the shadow state. 'this.$$' references the Property subclass.
		@shadowBound - this points to the Property subclass.
			'this' and this.$$' reference the Property subclass.'

	Be careful when using @shadowBound in comparing mutliple versions of the shadow state as is done in a
	React component's componentWillReceiveProps() method. When using @shadowBound, 'this._()' will point to
	the current shadow state. Remember that Property subclass exists across various iterations of
	the shadow state and 'this._()' always references the current shadow state. In constrast, when using
	@shadow, 'this._()' and 'this' reference the shadow state at the shadow state's instantiation.
*/
import { shadowBound } from "f.lux/lib/decorators";


/*
	f.lux Property demonstrating:
		* ObjectProperty subclass - class provides the basis for writing specialized f.lux properties with
			sub-properties. The ObjectProperty shadow state does not expose any methods for manipulating
			sub-properties thus providing a clean slate for defining a custom API.

			In this case, CounterProperty exposes two properties on the shadow state: numeric 'count' and
			boolean 'isRunning'. Notice how their values are set using the 'this._keyed.set()' idiom
			as direct assignment will not work since the readonly flag is set in 'stateSpec' class
			variable at the end of this file.

			The '_keyed' instance variable is created in the ObjectProperty parent class and encapsulates
			methods for manipulating sub-properties. '_keyed' is a KeyedApi instance so see the class for
			more details. This aggregation approach is taken to prevent polluting this class's API, thus
			enabling a subclass to define methods with worry of method name collisions.

		* stateSpec class property - a property class customizes the shadowing process by specifing a
			StateSpec instance on the 'stateSpec' static variable. This property class defines a StateSpec
			with auto-shadowing enabled and marks all sub-properties readonly. Setting the 'typeName' is
			useful for debugging.

			* auto-shadow - Setting the auto-shadow flag to 'true' means the f.lux virtual state system will
				parse the state and auto map properties onto the state variables.
			* readonly - code accessing the shadow state will not be able to assign values to the 'count' and
				'isRunning' properties:

					var counter = store.shadow.counter;

					counter.count = 5;  // this will have not affect

				As a result, CounterProperty methods cannot use 'this._().counter = 0' to set the 'counter'
				value and instead use the KeyedProperty.set(propName, value) method.
		* instance variable for transient data - transient data is temporary and not applicable if the
			store's state was reinitialized as is done with time traveling. In this case, the interval ID
			returned by setInterval() is transient data. If this state was restored at a later time using
			time travel the setInterval() function would have to be called again and would return a different
			ID. The CounterProperty methods can use instance variables to maintain values useful during the
			life of the property that extend beyond the timeframe of a single shadow state property.

		* @shadowBound decorator - annotates a method (or es2015 get/set property) as being part of the shadow
			state created by f.lux. @shadowBound decorator will ensure the 'this' reference for invoked methods
			is set to the Property subclass and not the shadow.  There is a companion @shadow decorator that
			sets the 'this' refernce to the shadow state. Most f.lux properties are implemented using a
			separate shadow definition but the decorator approach is handy for situations like this property
			when property methods use property level instance variables and make use of non-shadow state
			methods, such as _keyed.set(key, value) to set readonly state variables.

			The react component 'Counter' has access to three methods as part of the store.shadow.counter object:
				- start() - start the counter incrementing once per second
				- stop() - stops the counter incrementing every second
				- reset() - sets the counter to 0 but does not stop it from incrementing

			And of course there are the readonly variables 'counter.count' and 'counter.isRunning'.
*/
export default class CounterProperty extends ObjectProperty {
	/*
		f.lux Property life-cycle method called after the first time the store shadow's a state property
		mapped using this class. Useful for registering event handler and accessing the network.
	*/
	propertyDidShadow() {
		/*
			The 'isRunning' state variable would be true if the store were initialized with a state that
			had 'isRunning' set to true. The store's state takes precedence over the initial state value
			passed to the Property constructor.
		*/
		if (this._().isRunning) {
			this.start();
		}
	}

	/*
		f.lux Property life-cycle method called when a shadowed property is being replaced. Useful for freeing
		resources and unregistering event handlers.
	*/
	propertyWillUnshadow() {
		this.stop();
	}

	/*
		Adds a log entry to log property (ContentLogProperty.js). Notice how the store containing this property is
		accessed using the Property instance variable 'store' to get the 'log' property. Thus, properties can
		access other properties to effect changes.

		Just a normal method not mapped onto the shadow state.
	*/
	log(action) {
		const { log } = this.store().shadow;

		// this._() references the shadow state for this property
		log.addAction(action, this._().count);
	}

	/*
		Creates an interval timer that increments the counter property once per second.
	*/
	@shadowBound
	start() {
		if (this.intervalId) { return }

		// 'isRunning' property is readonly so use the _keyed instance varible from ObjectProperty parent class
		// set() method to update 'isRunning' value as 'this._().isRunning = true' will be a noop.
		this._keyed.set("isRunning", true);

		/*
			Use instance variables for transient state - values that have no meaning beyond the current
			property instantiation. In this case, loading the store's state into a store in a different
			process would make the current interval ID meaningly. The 'isRunning' flag on the other hand
			will be useful when reloading the state into another store.
		*/
		this.intervalId = setInterval( () => {
				console.log(`counter incrementing to ${this._().count + 1}`);

				// this._() references the shadow state for this property
				// this._().count++ will not work (no way to trap pre/postfix operators using defineProperty() )
				this._keyed.set("count", this._().count + 1);
			}, 1000);

		// add a log entry
		this.log("Start");
	}

	/*
		Stops the counter from incrementing but does not reset the counter value.
	*/
	@shadowBound
	stop() {
		if (!this.intervalId) { return }

		// mark the counter as stopped so reloading the state into another store will cause the counter to
		// not start automatically
		this._keyed.set("isRunning", false);

		// stop the timer and remove the ID
		clearInterval(this.intervalId);
		delete this.intervalId;

		// add a log entry
		this.log("Stop");
	}

	/*
		Resets the counter value to 0. Does not stop the incrementing process if the counter is running.
	*/
	@shadowBound
	reset() {
		// again, just set the value like regular javascript and the shadow state will propogate the change
		this._keyed.set("count", 0);

		// add a log entry
		this.log("Reset");
	}
}


/*
	Set the stateSpec on the class. This defines the initial state and marks the property as readonly.

	Autoshadowing is enabled by default so f.lux will automatically shadow the 'count' and 'isRunning'
	properties from the initial state using primitive property types.
*/
CounterProperty.stateSpec = StateType.create(CounterProperty)
	.initialState({ count: 0, isRunning: false })
	.readonly
	.typeName("CounterProperty");

StateType.defineType(CounterProperty);
console.log("CounterProperty.type", CounterProperty.type)

// this directive has the same affect as the '.initialState({...})' directive above
// this form is handy when autoshadow is disabled or want to be very explicit
	// .properties({
	//      count: PrimitiveProperty.type.initialState(0),
	//      isRunning: PrimitiveProperty.type.initialState(false)
	// })


