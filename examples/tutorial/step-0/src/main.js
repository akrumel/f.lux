// Load the babel polyfill for es2015 support
import "babel-polyfill";

import React from 'react';
import ReactDOM from 'react-dom';

import Todos from "./Todos.react";


// fire up the UI
ReactDOM.render(
	<Todos/>,
	document.getElementById('react-ui')
);


