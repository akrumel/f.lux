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
		* Collection operations:
			- fetch() - this is a simple app that we know has a connected collection at startup so we
				just fetch the values from the endpoint in the constructor. This should never throw
				an exception since using a local endpoint but it demonstrates getting the error.
			- isConnected() - checks if a collection has an endpoint. More complicated apps will have
				disconnected collections that back features not currently being utilized.
			- sortBy() - collections expose a number of useful methods. In this case, we use the
				lodash inspired sortBy() function (https://lodash.com/docs/4.17.3#sortBy) to sort
				the todos by completed and when created attributes. Other commonly used methods besides
				the obvious CRUD ops are entries(), every(), filter(), forEach(), groupBy(), keys(), map(),
				reduce(), and some(). Check it out.
			- fetching and synced flags - the collection exposes properties to check if the collection
				is currently peforming a fetch operation (fetching) or has already performed an operation
				to retrieve all items (synced). There are also properties for size and paging.

	The f.lux-react module has collection higher order components to remove the boiler plate from your
	code when working with collections.

	This sample demonstrates some basic CollectionProperty APIs and techniques and how to integrate it
	with a React UI. It cuts corners on error handling, dynamic enpoint changes based on user actions,
	and addquately dealing with network delays. Shortcuts taken to more clearly highlight working with
	collections and not on writing robust network applications (a different demo).
*/
export default class Todos extends Component {
	constructor(props) {
		super(props);

		const { store } = this.props;
		const { todos } = store._;

		// bind onStateChange callback so can use it to register/unregister
		this.onStateChangeCallback = this.onStateChange.bind(this);

		// register for store change notificiations
		store.subscribe(this.onStateChangeCallback);

		// retrieve the todo items from the endpoint. See TodoRootProperty for how this was setup.
		// likely not connected yet so will be a noop
		this.fetchTodos();
	}

	/*
		Invokes the collection fetch() method to retrieve all todo items.
	*/
	fetchTodos() {
		const { store } = this.props;
		const { todos } = store._;

		// fetch will work only if connected to an endpoint. Additionally, no need to check
		// if collection in the process of retrieving or already fetched collection models
		if (todos.isConnected() && !todos.synced && !todos.fetching) {
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
		// a bit busy way to do it but collection is guarded. a normal app would use a HOC
		// and work with props in componentWillReceiveProps() to decide when to fetch. keeping
		// it simple here
		this.fetchTodos();

		// brute force update entire UI on store change to keep demo app simple
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

	/*
		This function would normally be implemented as a component but keeping it simple to make logic
		easier to follow as the point is working with collections.
	*/
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
