import React from 'react';
import ReactDOM from 'react-dom';

import {
	Store,
	Logger as FluxLogger
} from "f.lux";
import { Provider } from "f.lux-react";

import TodoRootProperty from "./TodoRootProperty";
import Todos from "./Todos.react";

// Load the babel polyfill for es2015 support
require("babel-polyfill");


// create the store
const root = new TodoRootProperty();
const store = new Store(root);

// add logger as a listener - avaible in console as 'flog'. Example usage: 'flog.print'
const logger = new FluxLogger(store);
store.addListener(logger);


// fire up the UI
ReactDOM.render(
	<Provider store={ store }>
		<Todos/>
	</Provider>,
	document.getElementById('react-ui')
);


