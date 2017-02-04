import {
	ObjectProperty,
	PrimitiveProperty,
	Shadow,
} from "f.lux";


/*
	Three filter and sort constants exported so application has a single source of truth.
*/
export const AllFilter = "all";
export const CompletedFilter = "completed";
export const IncompleteFilter = "incomplete";
const DefaultFilter = AllFilter;

export const CreatedSort = "created";
export const DescSort = "desc";
export const UpdatedSort = "updated";
const DefaultSort = CreatedSort;


/*
	Filter functions available for easy lookup.
*/
const filters = {
	[AllFilter]: t => true,
	[CompletedFilter]: t => t.completed,
	[IncompleteFilter]: t => !t.completed,
};

/*
	Sort functions available for easy lookup. Each function is setup to return incomplete items
	before completed items.
*/
const sorters = {
	[CreatedSort]: (t1, t2) => t1.completed == t2.completed ?t1.momentCreated - t2.momentCreated :t1.completed,
	[DescSort]: (t1, t2) => t1.completed == t2.completed ?t1.desc.localeCompare(t2.desc) :t1.completed,
	[UpdatedSort]: (t1, t2) => t1.completed == t2.completed ?t2.momentUpdated - t1.momentUpdated :t1.completed,
}


/*
	The UiProperty shadow class with a single function for retrieving the todo list property filtered and
	sorted.

	Notice the use of 'this.$().rootShadow()' to get the store's root f.lux shadow state object
	(TodoRootProperty).
*/
class UiShadow extends Shadow {
	visibleTodos() {
		const { todos } = this.$().rootShadow();
		const { filter, sortBy } = this;
		const filterFn = filters[filter] || filters[DefaultFilter];
		const sortFn = sorters[sortBy] || sorters[DefaultSort];

		return todos.filter(filterFn).sort(sortFn);
	}
}


/*
	The UiProperty has primitive properties for the filter and the sorting criteria. The properties allow
	for assignment from the UI.
*/
export default ObjectProperty.createClass(UiShadow, type => {
	type.properties({
				filter: PrimitiveProperty.type.initialState(DefaultFilter),
				sortBy: PrimitiveProperty.type.initialState(DefaultSort)
			})
		.readonlyOff
		.typeName("UiProperty");
});


