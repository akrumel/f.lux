import React, { Component } from "react";


/*
	Component for adding a TodoProperty to the collection.

	Noteworthy:
		* New TodoProperty instances added using a specialized TodoCollection method called
			addTodo(string) that takes a description, creates an object with appriopriate
			defaults and calls the CollectionProperty.create(model).
*/
export default class AddTodo extends Component {
	addTodo() {
		const { todos } = this.props;
		const { todoInput } = this;
		const desc = todoInput.value;

		// description must be non-empty
		if (!desc.trim()) {
			return alert("Please enter a todo description");
		}

		// clear the input
		todoInput.value = "";

		// add todo using the TodoCollection.addTodo() function
		todos.addTodo(desc)
			.then( () => {
					// clear the input on successful addition
					todoInput.value = "";
				})
			.catch( error => {
					console.log(error.stack || error)
					alert(`Error adding todo.\n\n${error}`);
				})
	}

	render() {
		return <div className="addTodo">
				<input
					className="addTodo-desc"
					placeholder="What do you need to do?"
					ref={ ref => this.todoInput = ref }
					onKeyPress={ e => e.charCode === 13 && this.addTodo() }
				/>
				<button onClick={ () => this.addTodo() } className="btn addTodo-btn">
					<i className="fa fa-plus" />
					Add
				</button>
			</div>
	}
}