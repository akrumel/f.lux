A simple, standalone f.lux example implementing the class todo list.

Each file is heavily commented to provide context and interesting CollectionProperty related features and techiques. I encourage you to run the app and then explore the files. The store contains a root state that contains two properties:

* `todos` - contains the todo items state
* `ui` - contains state related to the user interface

The react UI is passed the 'store' property that references the single application store.


* * *


The project consists of the following files:

* main.js - the javascript entry point file. It creates the property model, creates the store, and renders the UI.
* AddTodo.react.js - component for adding a new todo item
* FilterSelector.react.js - component for setting the filter criteria
* SortSelector.react.js - component for setting the sort criteria
* TodoListProperty.js - specialized ArrayProperty for handling todos (acts like an Array)
* TodoItem.react.js - component for display a single todo item
* TodoProperty.js - specialized ObjectProperty for representing a todo item stored in the collection
* TodoRootProperty.js - the root property for the store. You may find its use of the f.lux property life-cycle interesting.
* Todos.react.js - the main UI component
* UiProperty.js - property used by UI components to configure todo item filtering and sorting

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


Note: this app accesses css resources through CDN based resources. So if you are running without a network connection the
styling will be bad.

* * *


The following libraries greatly sped the demo creation:

* (Font Awesome)[http://fontawesome.io/]
* (Moment)[http://momentjs.com/]
* (Picnic CSS)[http://picnicss.com/]
* (Pluralize)[https://github.com/blakeembrey/pluralize]
