import React from 'react';
import ReactDOM from 'react-dom';

import {
	createArrayPropertyType,
	KeyedProperty,
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
const logger = new FluxLogger(store);

// add logger as a listener - avaible in console as 'flog'. Example usage: 'flog.print'
store.addListener(logger);

window.store = store;

// fire up the UI
ReactDOM.render(
	<Counter store={ store }/>,
	document.getElementById('react-ui')
);


