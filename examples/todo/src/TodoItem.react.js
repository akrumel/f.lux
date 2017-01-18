import classnames from "classnames";
import React, { Component } from "react";


/*
	Component for a single TodoProperty.

	Noteworthy features:
		* destroyTodo() - Uses the shadow accessor ('$()') to destroy the todo property. All shadow
			properties have an accessor and properties contained in a collection have a superset of
			capabilities, including isDirty(), isNew(), remove(), save().
		* <input> onChange property - demonstrates updating a property value using assignment:

				todo.desc = event.target.value

			Assignment to a shadow property is implemented using a setter function that triggers an
			action that will update the store's state and trigger an update notification.

			Another example is shown in handleToggleCompleted().
		* saveTodo() - Uses the shadow accessor, todo.$(), to save the todo state through to
			the collection endpoint. The code 'todo.$().save()' invokes the collection to save
			the model. The save will include any pending updates.
*/
export default class TodoItem extends Component {
	destroyTodo() {
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

				<i className="todoItem-delete fa fa-times" onClick={ () => this.destroyTodo() }/>
			</div>
	}
}