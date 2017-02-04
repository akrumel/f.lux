import classnames from "classnames";
import React from "react";


/*
	Component for a single TodoProperty.
*/
export default function TodoItem(props, context) {
	const { todo, todos } = props;
	const { completed, desc } = todo;
	const descClasses = classnames("todoItem-desc", {
			"todoItem-descCompleted": completed
		});
	const completedClasses = classnames("todoItem-completed fa", {
			"fa-check-square-o todoItem-completedChecked": completed,
			"fa-square-o": !completed,
		});

	return <div className="todoItem">
			<i className={ completedClasses } onClick={ () => todo.completed = !todo.completed } />

			<input
				type="text"
				className={ descClasses }
				onChange={ event => todo.desc = event.target.value }
				defaultValue={ desc }
			/>

			<i className="todoItem-delete fa fa-times" onClick={ () => todos.removeTodo(todo) }/>
		</div>
}