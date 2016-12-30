A simple, standalong f.lux CollectionProperty example. A CollectionProperty provides built-in support for working with remote data. Collections are generic and perform data operations through an endpoint which could be a RESTful api, graphql, or a local data source. In this app, we use the PojoEndpointProperty to perform data operations against a local object. This makes getting the app up and running super easy and reliable.

Each file is heavily commented to provide context and interesting CollectionProperty related features and techiques. I encourage you to run the app and then explore the files. The store contains a root state that contains a single property containing the todo items stored in a TodoCollection. Each todo is represented using the TodoProperty type.

The react UI is passed the 'store' property that references the single application store.


* * *


The project consists of the following files:

* main.js - the javascript entry point file. It creates the property model, creates the store, and renders the UI.
* AddTodo.react.js - component for adding a new todo item
* TodoCollection.js - specialized CollectionProperty for handling todos
* TodoItem.react.js - component for display a single todo item
* TodoProperty.js - specialized ObjectProperty for representing a todo item stored in the collection
* TodoRootProperty.js - the root property for the store. You may find its use of the f.lux property life-cycle interesting.
* Todos.react.js - the main UI component


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
