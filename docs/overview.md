# f.lux Overview

## What is f.lux
f.lux is a data management library inspired by the [React flux architecture](https://facebook.github.io/flux/docs/overview.html) and influenced by [Redux](http://redux.js.org/) and [immutable.js](https://facebook.github.io/immutable-js/). This is third version of the f.lux approach and the first to be published open source. This version is actively used in commercial projects on both web and react-native platforms and really shines when implementing complex "business rule" applications, such as enterprise applications or rules based systems.

## High-level feature list

### Single store

All application state is stored in a single object tree as inspired by [Redux's single store approach](http://redux.js.org/docs/introduction/ThreePrinciples.html#single-source-of-truth). A single source of truth greatly simplifies application state management, reduces complexity, and eases debugging.

### Co-locate state and action functions

The f.lux store efficiently virtualizes the state tree into a shadow state as inspired by the React shadow DOM. The virtualization process, called shadowing, binds action-type functions onto the state tree properties. Binding the functions with the data makes explicit the operations that may be performed on a state tree property. The virtualization process can also expose virtualized properties for the underlying data that when set using `=` generates an update action without having to write any code. The exposed properties may also be set to readonly and will ensure the value is not updated, handy for object IDs.

The virtualization process is central to the f.lux architecture and is designed to be simple for common cases while exposing a straight-forward, declarative mechanism to customize the process on a per property basis. The application works with shadow objects just like traditional javascript objects. This means your application logic looks "normal" and you can interact and inspect state objects in the javascript console like regular objects. The shadow objects are immutable so interacting with them through property assignments and function invocation result in actions being dispatched to the store for in order processing. The store then generates a change event on the next tick for the application to process the new state.

To explicit, the virtualization process is recursively applied to the entire state tree. For performance reasons, the process occurs on a just-in-time basis so only the accessed properties are virtualized.

## Immutable state

All state changes occur indirectly through actions, usually through shadow object bound functions and properties.

Making changes through actions ensures changes happen in a strict order and store listeners receive a coherent and atomically updated state tree.

## Property life-cycle

State tree properties have a life-cycle that mirrors the React component life-cycle.

The property life-cycle is:

* `propertyWillShadow` - the state tree property is going to be virtualized
* `propertyDidShadow` - virtualization process completed
* `propertyWillUpdate` - an action updated the property's state resulting in a revirtualization of changed sub-properties
* `propertyDidUpdate` - revirtualization completed
* `propertyWillUnshadow` - property is being removed from the state tree

The motivating use for the life-cycle was inegrating with state changes external to the application code. External state changes examples include:

* web socket messages - a property can register for web socket messages when shadowed and unregister upon unshdadowing. This puts the logic for how to handle the message colocated with the other functions associated with that state property making the application logic easier to reason about and debug.
* push notifications - a dedicated state property can register for push notifications and store the associated information in a single location for the UI to process. Changes to the notification property will trigger a store change and provide a known state tree location to inspect. With a shadow function to `clear()` the notification the UI can remove the notification after performing any necessary UI update.
* phone rotation - a property may be defined to specify the current orientation and registeer/unregiseter for native platform updates. The natively registered called can update a sub-property specifying the orientation causing a store change event allowing the UI components to update appropriately. Again, native callback and associated state are colocated in the shadow state tree.
* application foreground/background changes - another example of registering with the native system to drive application state and update logic.

The virtualization architecture divides a shadow property into two entities:

* shadow - the virtualized interface used by the application logic to inspect and modify the state tree.
* property - analogous to a React component with a life-cycle (think of the shadow as the `render()` function though in the case it is an object). F.lux properties are by writing an ES2016 class.

Here is an example of a `react-native` orientation property:

```
import Orientation from "react-native-orientation";
import {
	ObjectProperty,
	PrimitiveProperty,
	Shadow,
	StateType,
} from "f.lux";
import { shadow } from "f.lux/lib/decorators";

import appDebug, { AppOrientationPropertyKey as DebugKey } from "./debug";
const debug = appDebug(DebugKey);


const _direction = "direction";

export const LandscapeOrientation = "LANDSCAPE";
export const PortraitOrientation = "PORTRAIT";
export const UnknownOrientation = "UNKNOWN";


export default class OrientationProperty extends ObjectProperty {
	propertyWillShadow() {
		// regiseter for orientation events (not showing removing orientation lister to shorten example)
		Orientation.addOrientationListener(orientation => this._onOrientationChange(orientation) );

		// get the current orientation (async op)
		Orientation.getOrientation( (err, orientation) => {
				if (err) {
					debug(`getOrientation() error`, err);
				} else {
					this._onOrientationChange(orientation);
				}
			});
	}

	_onOrientationChange(orientation) {
		if (orientation === UnknownOrientation) {
			return debug(`_onOrientationChange(): ignoring orientation update - orientation=${orientation}`);
		}

		// update the 'direction' property with the new orientation
		this._keyed.set(_direction, orientation);

		debug(`_onOrientationChange() orientation update: ${orientation}`);
	}
}
```

The statement `this._keyed.set(_direction, orientation);` is inherited from the `ObjectProperty` class to create a property set action, in this case on the `direction` property. There are other ways of doing this as explained in the upcoming programmer's guide. Also note, this code looks very different from the application logic that interacts with shadow properties. The UI could access the direction property using

```
import { LandscapeOrientation } from "./OrientationProperty";

...

const { orientation } = store.shadow;

console.log(orientation.direction);

if (store.shadow.orientation.direction === LandscapeOrientation) {
	// do something specific to landscape mode here
} else {
	// do something portriat specific here
}

```

The `direction` sub-property would be an ideal candidate for being readonly so the application logic could not change it though the `OrientationProperty` could change it using the line `this._keyed.set(_direction, orientation);`.

Implementing properties is one of the few cases where f.lux utilizes inheritance and seems natural since this is defining a new type. The f.lux approach is to avoid defining Property class hierarchies. A facility is provided for mixins where shared functionality needs to tie into the property life-cycle; a rarely needed but useful capability to have when desired.

## Collections (remote data)

f.lux provides built-in support for working with remote data through the `Collection` property type.

The Collections api is inspired by the simple (Backbone)[] collections for performing CRUD operations on remote data. The data operations are implemented through an abstraction called an endpoint. F.lux ships with support for REST and local endpoints. The local endpoint is often used for stub data during development and testing. Custom endpoints have been written for Couchbase and GraphQL data sources.

Collections live in the virtualized state tree like any other property and store all information in the actual state tree making them time travel compatible.

## Logging and time travel debugger

F.lux includes a logging facility and time travel debugger accessed through the javascript console.

Both facilities are exposed through a single console object. The `help` command lists the following:

```
f.lux logger commands:
	back          - moves backward in time by one store state frame
	clear         - removes all logs
	forward       - moves forward in time by one store state frame
	help          - f.lux logger commands
	index         - active index of store state frames
	maxFrames     - # of store updates to cache (default=50)
	print         - print logs to console
	printNoState  - print logs to console without state objects
	size          - # of store state frames available
	store         - gets the f.lux store

Functions:
	clearTrap(name)                    - clears a trap set by 'setTrap()'
	goto(idx)                          - move to a specific store state frame
	setMaxFrames(maxFrames)            - set the maximum number of store states to maintain (default=50)
	setTrap(cond, value, name=uuid)    - sets a debugger trap and returns name. conditino argument may be
	                                     a function taking next state or a string path to get a value
	tail(count=10, printState=true)    - prints last 'count' store updates


f.lux log available at window.flog
```


The store api used for implementing the logger and time travel debugger can be utilized to implement alternative implementations.

## `react-ui`

An add-on module providing React support for mapping store state to React component properties, collection mappings, and form components.