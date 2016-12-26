A simple, standalone f.lux data component example. The app store has a state with two object properties:

* root - the store's root property shadowed by AppRootProperty. The property is created using only
	the StateTypes for the child properties - super simple.
* counter - shadowed by CounterProperty. This state property maintains the counter value and whether
	the counter is currently running. This property demonstrates how to tie into the Property
	life-cycle and maintain transient state using instance variables.
* log - shadowed by CounterLogProperty. This state maintains a list of log entries describing when the
	counter was started, stopped, and reset. The log property demonstrates how to use a shadow literal
	to createa property, removing the need for subclassing a Property or Shadow class.

Two data components provide the shadow models for the store's state:

* CounterProperty - monotomically increments a counter value every second when running. The data
	component exposes three methods: start(), stop(), and reset(). Each method logs an action
	entry to the state.log property.
* CounterLogProperty - implements a log using an array. Exposes a single method that
	appends an entry to the log array:

	> `add(action, time)`


The react UI is passed the 'store' property that references the single application store. It renders the
counter, buttons for each counter property method, and prints the log.


* * *


The project consists of the following files:

* main.js - the javascript entry point file. It creates the property model, creates the store, and renders the UI.
* Counter.js - the react UI
* CounterProperty.js - the counter data componet.
* CounterLogProperty.js - implements a log using an array called 'actions'.


* * *

Setup instructions:

1. Install webpack globally:

	> npm install webpack -g

2. Install dependencies:

	> npm install

3. Compile the javascript code:

	> webpack

4. Open the public/index.html in a web browser

5. To run using webpack hot reloader (not React Hot Reloader module)
	1. Start the webpack dev server: `npm start`
	2. Point browser to: `http://localhost:8080/`


* * *



