The boilerplate for the f.lux Todo tutorial.


* * *


The project consists of the following files:

* main.js - the javascript entry point file.
* AddTodo.react.js - component for adding a new todo item
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
