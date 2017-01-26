import pluralize from "pluralize";
import React, { Component } from "react";

import AddTodo from "./AddTodo.react";
import TodoItem from "./TodoItem.react";


/*
	The main application UI.

	Noteworthy features:
		* Registering for store change notification (subsribe()/unsubscribe()). We brute force updates
			using 'this.forceUpdate()' here but normally you will use features of f.lux-react module
			to handle store udpate using higher order components. Just keeping it focused here.
		* TodoListProperty operations:
			- sortBy() - ArrayProperty exposes a number of useful methods, most of which are part of the
				javascript Array api. In this case, we use the lodash inspired sortBy() function
				(https://lodash.com/docs/4.17.3#sortBy) to sort the todos by completed and when created
				attributes. Other commonly used methods besides are entries(), every(), filter(), forEach(),
				groupBy(), keys(), map(), reduce(), and some(). Check it out.

	The f.lux-react module has collection higher order components to remove the boiler plate from your
	code when working with collections.

	This sample demonstrates some basic ArrayProperty and ObjectProperty APIs and techniques and how to
	integrate it with a React UI. It cuts corners on error handling, dynamic enpoint changes based on user
	actions, and addquately dealing with network delays. Shortcuts taken to more clearly highlight working
	with collections and not on writing robust network applications (a different demo).
*/
export default class Todos extends Component {
	componentWillMount() {
		const { store } = this.props;

		// bind onStateChange callback so can use it to register/unregister
		this.onStateChangeCallback = this.onStateChange.bind(this);

		// register for store change notificiations
		store.subscribe(this.onStateChangeCallback);
	}

	componentWillUnmount() {
		const { store } = this.props;

		store.unsubscribe(this.onStateChangeCallback);
	}

	/*
		Store subscribe callback for each time state changes.
	*/
	onStateChange() {
		// brute force update entire UI on store change to keep demo app simple
		this.forceUpdate();
	}

	render() {
		const { todos } = this.props.store._;
		const remainingText = `${ todos.incompleteSize } ${ pluralize("item", todos.incompleteSize ) } remaining`;

		return <div className="todoContainer">
				<h1>
					F.lux Todos <small>{ remainingText }</small>
				</h1>

				<AddTodo todos={ todos } />

				{ this.renderTodos() }
			</div>
	}

	/*
		This function would normally be implemented as a component but keeping it simple to make logic
		easier to follow as the point is working with collections.
	*/
	renderTodos() {
		const { todos } = this.props.store._;

		if (todos.length) {
			return todos
				.sortBy([ 'completed', t => -t.momentCreated().valueOf() ])
				.map( t => <TodoItem key={ t.$().pid() } todo={ t } todos={ todos } /> );
		} else {
			return <p className="noItems">What do you want to do today?</p>
		}
	}
};
