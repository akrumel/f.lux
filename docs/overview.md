# f.lux Overview

## What is f.lux

f.lux is a data management library inspired by the [React flux architecture](https://facebook.github.io/flux/docs/overview.html) and influenced by [Redux](http://redux.js.org/) and [immutable.js](https://facebook.github.io/immutable-js/). This is third version of the f.lux approach and the first to be published open source. This version is actively used in commercial projects on both web and react-native platforms and really shines when implementing complex "business rule" applications, such as enterprise applications or rules based systems.

### High-level feature list

* Single store

All application state is stored in a single object tree as inspired by [Redux's single store approach](http://redux.js.org/docs/introduction/ThreePrinciples.html#single-source-of-truth). A single source of truth greatly simplifies application state management, reduces complexity, and eases debugging.

* Co-locate state and action functions

The f.lux store efficiently virtualizes the state tree into a shadow state as inspired by the React shadow DOM. The virtualization process, called shadowing, binds action-type functions onto the state tree properties. Binding the functions with the data makes explicit the operations that may be performed on a state tree property. The virtualization process can also expose virtualized properties for the underlying data that when set using `=` generates an update action without having to write any code. The exposed properties may also be set to readonly and will ensure the value is not updated, handy for object IDs.

The virtualization process is central to the f.lux architecture and is designed to be simple for common cases while exposing a straight-forward, declarative mechanism to customize the process on a per property basis. The application works with shadow objects just like traditional javascript objects. This means your application logic looks "normal" and you can interact and inspect state objects in the javascript console like regular objects. The shadow objects are immutable so interacting with them through property assignments and function invocation result in actions being dispatched to the store for in order processing. The store then generates a change event on the next tick for the application to process the new state.

* Immutable state

All state changes occur indirectly through actions, usually through shadow object bound functions and properties.

Making changes through actions ensures changes happen in a strict order and store listeners receive a coherent and atomically updated state tree.

* Collections (remote data)

f.lux provides built-in support for working with remote data through Collections.

The Collections api is inspired by the simple (Backbone)[] collections for performing CRUD operations on remote data. The data operations are implemented through an abstraction called an endpoint. F.lux ships with support for REST and local endpoints. The local endpoint is often used for stub data during development and testing. Custom endpoints have been written for Couchbase and GraphQL data sources.

Collections live in the virtualized state tree like any other property and store all information in the actual state tree making them time travel compatible.

* Logging and time travel debugger

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

* `react-ui`

An add-on module providing React support for mapping store state to React component properties, collection mappings, and form components.