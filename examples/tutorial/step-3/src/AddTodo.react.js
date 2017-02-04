import React, { Component } from "react";


/*
	Component for adding a TodoProperty to the list.
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

		// add todo using the TodoListProperty.addTodo() action function
		todos.addTodo(desc);

		// clear the input
		todoInput.value = "";
	}

	render() {
		return <div className="addTodo">
				<input
					className="addTodo-desc"
					placeholder="What do you need to do?"
					onKeyPress={ e => e.charCode === 13 && this.addTodo() }
					ref={ ref => this.todoInput = ref }
				/>
				<button onClick={ () => this.addTodo() } className="btn addTodo-btn">
					<i className="fa fa-plus" />
					Add
				</button>
			</div>
	}
}