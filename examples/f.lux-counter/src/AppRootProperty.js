
import {
	createKeyedPropertyType,
	StateTypes,
} from "f.lux";

import CounterLogProperty from "./CounterLogProperty";
import CounterProperty from "./CounterProperty";


const stateSpec = {
	counter: StateTypes.property(CounterProperty),
	log: StateTypes.property(CounterLogProperty)
}

const AppRootProperty = createKeyedPropertyType({}, stateSpec);

export default AppRootProperty;