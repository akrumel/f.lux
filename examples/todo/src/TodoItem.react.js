import classnames from "classnames";
import React, { Component } from "react";


/*
	Component for a single TodoProperty.

	Noteworthy features:
		* removeTodo() - Calls the TodoListProperty removeTodo() action function to remove a Todo
			shadow property from the list.
		* <input> onChange property - demonstrates updating a property value using assignment:

				todo.desc = event.target.value

			Assignment to a shadow property is implemented using a setter function that triggers an
			action that will update the store's state and trigger an update notification.

			Another example is shown in handleToggleCompleted().
*/
export default class TodoItem extends Component {
	removeTodo() {
		const { todo, todos } = this.props;

		todos.removeTodo(todo);
	}

	handleToggleCompleted() {
		const { todo } = this.props;

		// toggle the completed flag
		todo.completed = !todo.completed;
	}

	render() {
		const { todo } = this.props;
		const { completed, desc } = todo;
		const descClasses = classnames("todoItem-desc", {
				"todoItem-descCompleted": completed
			});
		const completedClasses = classnames("todoItem-completed fa", {
				"fa-check-square-o todoItem-completedChecked": todo.completed,
				"fa-square-o": !completed,
			});

		return <div className="todoItem">
				<i className={ completedClasses } onClick={ () => this.handleToggleCompleted() } />

				<input
					type="text"
					className={ descClasses }
					onChange={ event => todo.desc = event.target.value }
					defaultValue={ desc }
				/>

				<i className="todoItem-delete fa fa-times" onClick={ () => this.removeTodo() }/>
			</div>
	}
}