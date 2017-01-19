import React, { Component } from "react";


/*
	Component for adding a TodoProperty to the list.
*/
export default class AddTodo extends Component {
	addTodo() {
		// coming soon
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