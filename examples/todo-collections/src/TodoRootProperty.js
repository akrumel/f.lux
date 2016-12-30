import moment from "moment";

import {
	ObjectProperty,
	StateType,
} from "f.lux";

import {
	PojoEndpointProperty
} from "f.lux/lib/collection";

import TodoCollection from "./TodoCollection";


/*
	Root property for the store. In this simple app the root has a single sub-property of type
	TodoCollection. In this case, the TodoCollection could serve as the root proper but this is
	an unusually simple case so struturing it under the root for the sake of normalality.

	This is the one property in this app that implements an actual Property subclass. The ObjectProperty
	provides a base class that models a simple literal object. It's default shadow type does not
	expose any methods for adding, remove, iterating properties so it is a blank slate for implementing
	your own object types. In this case, we specify the root state can have a single attribute
	or sub-property called 'todos'. The actual state contained in the store may have more information
	but that is all that will be exposed to the app.

	A note about Property subclasses: A Property is an object that exists while the store keeps the
	associated raw state it represents. Most of you data will be represented by implicit Property
	instances but writing your own Property class is handy when you need to:
		* tie into the native os
		* perform setup/teardown operations such as web socket registrations
		* manage timers, check for updates, update a calculated value,...

	Each property experiences a life-cycle analygous to UI components, such as React components.

	Noteworthy features:
		* propertyDidShadow() - the life-cycle method called immediately after the property has
			been shadowed. All operations and data manipulations will function at this point. Used
			in this *demo* app to setup initial collection data.
		* this._() - gets the property's shadow state, an instance of TodoCollectionShadow (see the
			TodoCollection.js file).
		* collection.setEndpoint(ep) - attaches a data source to the collection for performing
			CRUD operations
		* StateType.defineType() - StateType is the basis for the shadowing process. The defineType()
			static function assigns a 'type' static variable to a property class. The 'type' class
			variables are used in multiple ways during system setup and shadowing.
*/
export default class TodoRootProperty extends ObjectProperty {
	constructor() {
		super(TodoRootProperty.type);
	}

	/*
		Property life-cycle method called when property being initially shadowed. Analygous to
		React's properptyWillMount(). We use this as an opportunity to set the endpoint which
		is just a local object with two todos. The RestEndpointProperty is most commonly used
		in realworld apps but PojoEndpointProperty is good for testing.
	*/
	propertyDidShadow() {
		// get the shadow representing the TodoCollection subproperty
		const { todos } = this._();

		// setup the collection endpoint using a local object as the data source (good for demos
		// and testing).
		const todoEp = new PojoEndpointProperty({
			1: { id: 1, desc: "Dream big!", completed: true, created: moment().subtract(1, 'days').toISOString() },
			2: { id: 2, desc: "Don't let your dreams be dreams", completed: false, created: moment().toISOString() }
		})

		// Collection properties are generic and use endpoints to connect to data sources
		// using various protocols. Data source in this case is a literal object but is
		// normally a RestEndpointProperty. I have implemented endpoints for couchbase
		// and graphql
		todos.setEndpoint(todoEp);
	}
}


/*
	Convenience function to setup the 'TodoRootProperty.type' class variable. The 'type' variable
	is used for definiting the default shadowing process for a data type. See the line
	'todos: TodosCollection.type' for an example use.

	This process is analygous to React's propTypes setup.
*/
StateType.defineType(TodoRootProperty, spec => {
	spec.initialState({})                       // empty object initial state
		.autoshadowOff                          // do not shadow state values without explicit sub-property definitions
		.properties({                           // define sub-properties (just one in this case)
				todos: TodoCollection.type,     // 'todos' is a collection property
			})
		.readonly                               // prevent application code from reassigning the 'todos' collection (paranoia)
		.typeName("TodoRootProperty");          // useful for certain diagnostic situations
});


