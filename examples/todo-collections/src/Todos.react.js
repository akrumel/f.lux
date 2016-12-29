import pluralize from "pluralize";
import React, { Component } from "react";

import AddTodo from "./AddTodo.react";
import TodoItem from "./TodoItem.react";


export default class Todos extends Component {
	constructor(props) {
		super(props);

		const { store } = this.props;
		const { todos } = store._;

		// bind onStateChange callback so can use it to register/unregister
		this.onStateChangeCallback = this.onStateChange.bind(this);

		store.subscribe(this.onStateChangeCallback);
		this.fetchTodos();
	}

	fetchTodos() {
		const { store } = this.props;
		const { todos } = store._;

		if (todos.isConnected()) {
			todos.fetch()
				.catch( error => alert(`Unabled to retrieve todos\n\n${error}`));
		}
	}

	componentWillUnmount() {
		const { store } = this.props;

		store.unsubscribe(this.onStateChangeCallback);
	}

	/*
		Store subscribe callback for each time state changes.
	*/
	onStateChange() {
		const { store } = this.props;
		const { todos } = store._;

		if (!todos.synced && !todos.fetching) {
			this.fetchTodos();
		}

		this.forceUpdate();
	}

	render() {
		const { store, todos } = this.props.store._;
		const remainingText = `${ todos.incompleteSize } ${ pluralize("item", todos.incompleteSize ) } remaining`;

		return <div className="todoContainer">
				<h1>
					F.lux Collection Todos <small>{ remainingText }</small>
				</h1>

				<AddTodo todos={ todos } />

				{ this.renderTodos() }
			</div>
	}

	renderTodos() {
		const { store, todos } = this.props.store._;

		if (todos.size) {
			return todos
				.sortBy([ 'completed', t => -t.momentCreated().valueOf() ])
				.map( t => <TodoItem key={ t.$().pid() } store={ store } todo={ t } /> );
		} else {
			return <p className="noItems">What do you want to do today?</p>
		}
	}
};
