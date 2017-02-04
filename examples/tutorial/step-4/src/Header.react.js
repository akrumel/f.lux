import pluralize from "pluralize";
import React from "react";

import { storeContainer } from "f.lux-react";


/*
	Generates an <h1> tags containing the app title and number of remaining items.
*/
function Header(props, context) {
	const { todos } = props;
	const remainingText = `${ todos.incompleteSize } ${ pluralize("item", todos.incompleteSize ) } remaining`;

	return <h1>
			F.lux Todos <small>{ remainingText }</small>
		</h1>
}


export default storeContainer( shadow => ({ todos: shadow.todos }) )(Header);

