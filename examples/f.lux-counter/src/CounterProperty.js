
import {
	KeyedProperty,
	StateTypes,
} from "f.lux";

/*
	@shadow and @shadowBound decorators mark es2015 properties (get/set) and methods to be exposed on the
	shadow state. Their behavior differs on what the 'this' reference is:
		@shadow - this points to the shadow state. Access the Property subclass using this.$$.
			'this' and 'this._' reference to the shadow state. 'this.$$' references the Property subclass.
		@shadowBound - this points to the Property subclass.
			'this' and this.$$' reference the Property subclass.'

	Be careful when using @shadowBound in comparing mutliple versions of the shadow state as is done in a
	React component's componentWillReceiveProps() method. When using @shadowBound, 'this._' will point to
	the current shadow state. Remember that Property subclass exists across various iterations of
	the shadow state and 'this._' always references the current shadow state. In constrast, when using
	@shadow, 'this._' and 'this' reference the shadow state at the shadow state's instantiation.
*/
import { shadowBound } from "f.lux/lib/decorators";


/*
	f.lux Property demonstrating:
		* subclass KeyedProperty - class provides the basis for writing specialized object type properties.
			In this case, the property exposes two properties on the shadow state: numeric 'count' and
			boolean 'isRunning'. Notice how their values are set using the KeyedProperty set() method
			as direct assignment will not work since the readonly flag is set in super().
		* auto-shadow - the second parameter to the super() constructor call represents auto shadow flag.
			Setting the flag to true means the f.lux virtual state system will parse the state and auto
			map properties onto the state variables.
		* readonly - the third parameter to the super() constructor call means that code accessing the
			shadow state will not be able to assign values to the 'count' and 'isRunning' properties:

				var counter = store.shadow.counter;

				counter.count = 5;  // this will have not affect

			As a result, CounterProperty methods cannot using 'this._.counter = 0' to set the 'counter'
			value and instead use the KeyedProperty.set(propName, value) method.
		* instance variable for transient data - transient data is temporary and not applicable if the
			store's state was reinitialized as is done with time traveling. In this case, the interval ID
			returned by setInterval() is transient data. If this state was restored at a later time using
			time travel the setInterval() function would have to be called again and would return a different
			ID. The CounterProperty methods can use instance variables to maintain values useful during the
			life of the property that extend beyond the timeframe of a single shadow state property.
		* @shadowBound decorator - annotates a method (or es2015 get/set property) as being part of the shadow
			state created by f.lux. The react component 'Counter' has access to three methods as part of the
			store.shadow.counter object:
				- start() - start the counter incrementing once per second
				- stop() - stops the counter incrementing every second
				- reset() - sets the counter to 0 but does not stop it from incrementing

			And of course there are the readonly variables 'counter.count' and 'counter.isRunning'.
*/
export default class CounterProperty extends KeyedProperty {
	/*
		f.lux Property life-cycle method called after the first time the store shadow's a state property
		mapped using this class. Useful for registering event handler and accessing the network.
	*/
	propertyDidShadow() {
		/*
			The 'isRunning' state variable would be true if the store were initialized with a state that
			had 'isRunning' set to true. The store's state takes precedence over the initial state value
			passed to the Property constructor. You can override getInitialState() to change this
			behavior.
		*/
		if (this._.isRunning) {
			this.start();
		}
	}

	/*
		f.lux Property life-cycle method called when a shadowed property is being replaced. Useful for freeing
		resources and unregistering event handlers.
	*/
	propertyWillUnshadow() {
		this.stop();
		console.log("CounterProperty is unshadowing")
	}

	/*
		Adds a log entry to log property (ContentLogProperty.js). Notice how the store containing this property is
		accessed using the Property instance variable 'store' to get the 'log' property. Thus, properties can
		access other properties to effect changes.

		Just a normal method not mapped onto the shadow state.
	*/
	log(action) {
		const log = this.store.shadow.log;

		log.addAction(action, this._.count);
	}

	/*
		Creates an interval timer that increments the counter property once per second.
	*/
	@shadowBound
	start() {
		if (this.intervalId) { return }

		// this._ references the shadow state so assigning a value to the state will cause a state
		// change to pushed to all store subscribers.
		this.set("isRunning", true);

		/*
			Use instance variables for transient state - values that have no meaning beyond the current
			property instantiation. In this case, loading the store's state into a store in a different
			process would make the current interval ID meaningly. The 'isRunning' flag on the other hand
			will be useful when reloading the state into another store.
		*/
		this.intervalId = setInterval( () => {
				console.log(`counter incrementing to ${this._.count + 1}`);

				// this._.count++ will not work (no way to trap pre/postfix operators using defineProperty() )
				this.set("count", this._.count + 1);
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
		this.set("isRunning", false);

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
		this.set("count", 0);

		// add a log entry
		this.log("Reset");
	}
}


/*
	Set the stateSpec on the class. This defines the initial state and marks the property as readonly.

	Autoshadowing is enabled by default so f.lux will automatically shadow the 'count' and 'isRunning'
	properties from the initial state using primitive property types.
*/
CounterProperty.stateSpec = StateTypes.property(CounterProperty)
	.initialState({ count: 0, isRunning: false })
	.readonly

// next two directives have the same affect as the '.initialState({...})' directive above
	// .defaults({ count: 0, isRunning: false })
	// .initialState({ })

// next directive has the same affect as the '.initialState({...})' directive above
// this form is handy when autoshadow is disabled or want to be very explicit
	// .properties({
	// 	count: StateTypes.Primitive.initialState(0),
	// 	isRunning: StateTypes.Primitive.initialState(false)
	// })


