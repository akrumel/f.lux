import pluralize from "pluralize";
import React, { Component } from "react";

import AddTodo from "./AddTodo.react";
import TodoItem from "./TodoItem.react";
import FilterSelector from "./FilterSelector.react";
import SortSelector from "./SortSelector.react";


/*
	The main application UI.
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
		const { todos, ui } = this.props.store._;
		const remainingText = `${ todos.incompleteSize } ${ pluralize("item", todos.incompleteSize ) } remaining`;

		return <div className="todoContainer">
				<h1>
					F.lux Todos <small>{ remainingText }</small>
				</h1>

				<AddTodo todos={ todos } />

				{ this.renderTodos() }

				<div className="tools">
					<FilterSelector ui={ ui } />
					<SortSelector ui={ ui } />
				</div>
			</div>
	}

	/*
		Renders a <TodoItem> for each todo item state object. The items to render are obtained from
		'ui.visisbleTodos()', instead of the 'todos' array, to get a properly filter and sorted
		array.

		This function would normally be implemented as a component but keeping it simple to make logic
		easier to follow as the point is working with collections.
	*/
	renderTodos() {
		const { todos, ui } = this.props.store._;
		const visibleTodos = ui.visibleTodos();

		if (visibleTodos.length) {
			return visibleTodos.map( t => <TodoItem key={ t.$().pid() } todo={ t } todos={ todos } /> );
		} else if (todos.length === 0) {
			return <p className="noItems">What do you want to do today?</p>
		} else {
			return <p className="noItems">No items are { ui.filter }</p>
		}
	}
};
