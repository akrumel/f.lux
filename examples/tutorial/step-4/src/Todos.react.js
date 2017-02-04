import React from "react";

import AddTodo from "./AddTodo.react";
import Header from "./Header.react";
import TodoList from "./TodoList.react";
import Toolbar from "./Toolbar.react";


/*
	The main application UI.
*/
export default function Todos(props, context) {
	return <div className="todoContainer">
			<Header />

			<AddTodo />
			<TodoList />

			<Toolbar />
		</div>
}

