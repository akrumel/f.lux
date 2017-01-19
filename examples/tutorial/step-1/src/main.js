// Load the babel polyfill for es2015 support
import "babel-polyfill";
import React from 'react';
import ReactDOM from 'react-dom';

import {
	Store,
	ObjectProperty
} from "f.lux";

import Todos from "./Todos.react";

// create the store and starting state
const root = new ObjectProperty();
const state = { todos: [] }
const store = new Store(root, state);

// for easy access from the console
window.store = store;


// fire up the UI
ReactDOM.render(
	<Todos store={ store }/>,
	document.getElementById('react-ui')
);


