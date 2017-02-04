import React from "react";

import { CreatedSort, DescSort, UpdatedSort } from "./UiProperty";


/*
	Component for setting the todo item sort criteria. Notice how this component sets the 'ui.sortBy' property
	that is used by the 'ui.visibleTodos()' function. 'ui.visibleTodos()' is used by <Todos> to retrieve the
	filtered and sorted items.
*/
export default function SortSelector(props, context) {
	const { ui } = props;

	return <div className="tools-selector">
			<span>Sort:</span>

			<select onChange={ e => ui.sortBy = e.target.value }>
				<option value={ CreatedSort }>Created At</option>
				<option value={ DescSort }>Description</option>
				<option value={ UpdatedSort }>Last Modified</option>
			</select>
		</div>
}