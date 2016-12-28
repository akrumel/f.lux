import pluralize from "pluralize";
import React, { Component } from "react";

import AddTodo from "./AddTodo.react";


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
		const { todos } = this.props.store._;

		return <div className="todoContainer">
				<h1>
					Todos <small>{ todos.size } { pluralize("item", todos.size) }</small>
				</h1>

				<AddTodo todos={ todos } />

				<ul>
					{
						todos.map( t => {
								return <li key={t.$().pid()}>{ `${t.desc} created ${ t.momentCreated().from() } - new=${t.$().isNew()}`}</li>
							})
					}
				</ul>
			</div>
	}
};
