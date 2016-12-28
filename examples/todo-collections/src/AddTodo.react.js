import React, { Component } from "react";


export default class AddTodo extends Component {
	addTodo() {
		const { todos } = this.props;
		const { todoInput } = this;
		const desc = todoInput.value;

		if (!desc.trim()) {
			return alert("Please enter a todo description");
		}

		todos.addTodo(desc)
			.then( () => {
					// clear spinning

					todoInput.value = "";
				})
			.catch( error => {
					console.log(error.stack || error)
					// clear spinning

					alert(`Error adding todo.\n\n${error}`)
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