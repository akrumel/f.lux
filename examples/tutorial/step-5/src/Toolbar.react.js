import React from "react";

import { storeContainer } from "f.lux-react";

import FilterSelector from "./FilterSelector.react";
import SortSelector from "./SortSelector.react";


/*
	Bottom anchored toolbar containing the filtering and sorting selectors.
*/
function Toolbar(props, context) {
	const { ui } = props;

	return <div className="tools">
			<FilterSelector ui={ ui } />
			<SortSelector ui={ ui } />
		</div>
}


export default storeContainer( shadow => ({ ui: shadow.ui }) )(Toolbar);
