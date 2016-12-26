import React from 'react';
import ReactDOM from 'react-dom';

import {
	Store,
	Logger as FluxLogger
} from "f.lux";

import AppRootProperty from "./AppRootProperty";
import Counter from "./Counter";

// Load the babel polyfill for es2015 support
require("babel-polyfill");


// create the store
const root = new AppRootProperty();
const store = new Store(root);

// add logger as a listener - avaible in console as 'flog'. Example usage: 'flog.print'
const logger = new FluxLogger(store);
store.addListener(logger);

// for easy access from the console. Could also access through the logger
window.store = store;


// fire up the UI
ReactDOM.render(
	<Counter store={ store }/>,
	document.getElementById('react-ui')
);


