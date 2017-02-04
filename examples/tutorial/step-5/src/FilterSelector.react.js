import React from "react";

import { AllFilter, CompletedFilter, IncompleteFilter } from "./UiProperty";


/*
	Component for setting the todo item filter criteria. Notice how this component sets the 'ui.filter' property
	that is used by the 'ui.visibleTodos()' function. 'ui.visibleTodos()' is used by <Todos> to retrieve the
	filtered and sorted items.
*/
export default function FilterSelector(props, context) {
	const { ui } = props;

	return <div className="tools-selector">
			<span>Filter:</span>

			<select onChange={ e => ui.filter = e.target.value }>
				<option value={ AllFilter }>All</option>
				<option value={ CompletedFilter }>Completed</option>
				<option value={ IncompleteFilter }>Not Completed</option>
			</select>
		</div>
}

