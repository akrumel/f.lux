import React from "react";

import { storeContainer } from "f.lux-react";

import TodoItem from "./TodoItem.react";


/*
	Component displays the todo items or an appropriate message if there are not items to display.
*/
function TodoList(props, context) {
	const { todos, ui } = props;
	const visibleTodos = ui.visibleTodos();

	if (todos.length === 0) {
		return <p className="noItems">What do you want to do today?</p>
	} else if (visibleTodos.length === 0) {
		return <p className="noItems">No items are { ui.filter }</p>
	}

	return <div>
		{
			visibleTodos.map( t => <TodoItem key={ t.$().pid() } todo={ t } todos={ todos } /> )
		}
		</div>
}


export default storeContainer( shadow => shadow )(TodoList);
