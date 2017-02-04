import React from 'react';
import ReactDOM from 'react-dom';

import { Store } from "f.lux";

import TodoRootProperty from "./TodoRootProperty";
import Todos from "./Todos.react";

// Load the babel polyfill for es2015 support
require("babel-polyfill");

// create the store
const root = new TodoRootProperty();
const store = new Store(root);

// fire up the UI
ReactDOM.render(
	<Todos store={ store }/>,
	document.getElementById('react-ui')
);


