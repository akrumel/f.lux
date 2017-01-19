import React, { Component } from "react";

import AddTodo from "./AddTodo.react";


/*
	The main application UI.
*/
export default class Todos extends Component {
	render() {
		return <div className="todoContainer">
				<h1>
					F.lux Todos <small># items remaining goes here</small>
				</h1>

				<AddTodo />

				{ this.renderTodos() }
			</div>
	}

	/*
		This function would normally be implemented as a component but keeping it simple to make logic
		easier to follow as the point is working with collections.
	*/
	renderTodos() {
		return <p className="noItems">What do you want to do today?</p>
	}
};
