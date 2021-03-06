import {
	ObjectProperty,
	StateType,
} from "f.lux";

import CounterLogProperty from "./CounterLogProperty";
import CounterProperty from "./CounterProperty";


/*
	Application root property that is a simple object exposing two properties:
		* counter - simple counter with count and isRunning readonly properties along with
			start(), stop(), and reset() methods.
		* log - list of log entries describing actions taken by the user.

	Log enties are generated by the counter which accesses the 'log' through the store
	ahadow state.
*/
export default ObjectProperty.createClass({}, spec => {
	spec.properties({
				counter: CounterProperty.type,
				log: CounterLogProperty.type,
			})
		.typeName("AppRootProperty");
});

