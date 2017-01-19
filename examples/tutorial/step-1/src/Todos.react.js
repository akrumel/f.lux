import pluralize from "pluralize";
import React, { Component } from "react";

import AddTodo from "./AddTodo.react";
import TodoItem from "./TodoItem.react";


/*
	The main application UI.
*/
export default class Todos extends Component {
	constructor(props) {
		super(props);

		const { store } = this.props;
		const { todos } = store.shadow;

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
		const { todos } = this.props.store.shadow;
		const numIncomplete = todos.filter( t => !t.completed ).length;
		const remainingText = `${ numIncomplete } ${ pluralize("item", numIncomplete ) } remaining`;

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
				.sortBy('completed')
				.map( t => <TodoItem key={ t.$().pid() } todo={ t } todos={ todos } /> );
		} else {
			return <p className="noItems">What do you want to do today?</p>
		}
	}
};
