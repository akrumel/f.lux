import ArrayProperty from "./ArrayProperty";
import CollectionProperty from "./collection/CollectionProperty";
import IndexedProperty from "./IndexedProperty";
import KeyedProperty from "./KeyedProperty";
import MapProperty from "./MapProperty";
import PropertyFactoryShader from "./PropertyFactoryShader";
import PrimitiveProperty from "./PrimitiveProperty";
import Property from "./Property";
import StateType from "./StateType";


export default {
	get Primitive() {
		return new StateType(PrimitiveProperty);
	},

	get Array() {
		const type = new StateType(ArrayProperty);

		return type;
	},

	arrayOf(elementStateType) {
		const type = new StateType(ArrayProperty);

		type.setElementType(elementStateType);

		return type;
	},

	get Indexed() {
		const type = new StateType(IndexedProperty);

		return type;
	},

	indexedOf(elementStateType) {
		const type = new StateType(IndexedProperty);

		type.setElementType(elementStateType);

		return type;
	},


// CollectionProperty needs refactoring to support
	// collectionOf(elementStateType) {
	// 	const type = new StateType(CollectionProperty);

	// 	// will call the setElementType() method after property created - will need to add
	// 	// functionality to the factory shader
	// 	type.setManagedPropertyType(elementStateType);

	// 	return type;
	// },

	keyed(defn={}) {
		const type = new StateType(KeyedProperty);
		var propType;

		for (let key in defn) {
			propType = defn[key];

			type.addProperty(key, defn[key]);
		}

		return type;
	},

	// Deprecated - use MapProperty.mapType()
	map(defn={}) {
		const type = new StateType(MapProperty);
		var propType;

		for (let key in defn) {
			propType = defn[key];

			type.addProperty(key, defn[key]);
		}

		return type;
	},

	// Deprecated - use MapProperty.mapTypeOf()
	mapOf(elementStateType) {
		const type = new StateType(MapProperty);

		type.setElementType(elementStateType);

		return type;
	},

	property(PropertyClass) {
		if (PropertyClass.stateSpec) {
			return PropertyClass.stateSpec;
		}

		return new StateType(PropertyClass);
	},
}