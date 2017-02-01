# Step 2: Properties

## Overview

This step defines f.lux `Property` types for the top-level state object, todos list, and todo items. Defining and using custom f.lux `Property` types is at the heart of all f.lux based applications because this is the mechanism for colocating application functional logic with the application state.


## Goals

1. [Todo property](#user-content-todo)
2. [Todo list property](#user-content-todos)
3. [Define the root property](#user-content-root)
4. [Update UI to use `TodoListProperty` and `TodoProperty`](#user-content-ui)
5. [Track todo item update time](#user-content-update)

The [`examples/tutorial/step-2`](https://github.com/akrumel/f.lux/tree/master/examples/tutorial/step-2) directory contains the completed code for this step.

## Technical background

### `Property` features

This step will explore writing your own shadow types and customizing the shadowing process. This feature is the root motivation for developing the f.lux library and key to making your application logic easier to reason about and maintain. The [previous step](step-1.md) discussed the default shadowing capability known as 'auto-shadowing'. Now let's learn how to extend it using a declarative and composable approach.

This tutorial step will explore some interesting f.lux `Property` features:

* **Life-cycle**

	A property exists for the life of the underlying state and exposes hooks into the life-cycle. These hooks allow properties to register for system events, manage web sockets, update persistent stores, or log information. 

	The life-cycle methods are:
	
	- `propertyWillShadow()` - invoked just before the shadow property is going to be added to the shadow state.
	- `propertyDidShadow()` - state property was shadowed and fully functional.
	- `propertyChildInvalidated(childProperty, sourceProperty)` - A child property mutation action has occurred and it's value will change in store's next update.
	- `propertyDidUpdate()` - State managed by this property has changed.
	- `propertyWillUnshadow()` - invoked just before the shadow property is removed from the shadow state because the state property being shadowed has been removed from the application state.
	
* **Immutable shadow**

	Explored in the previous step.
 
* **Shadow api**

	Colocating application state with application logic is a foundational f.lux goal to improve type safety and make an application easier to reason about. This is accomplished by specifying a shadow api for a property or utilizing the default api provided by f.lux (as was done in the previous step). This is actually how the `todos.map()` array function from the previous chapter is implemented behind the scenes:

	```
	todos.map( t => <TodoItem todo={ t } todos={ todos } /> )
	```

	Writing a shadow api is just like writing a javascript class or defining a javascript object without the need to define and manage the data since that already exists in the f.lux `Store`. This will be a focus in this step. 

* **`type` class variable**

	Each `Property` type exposes a `type` class variable describing how the state data should be shadowed. An appropriate default is provided for each `Property` type and is extremely easy to customize or assign. The `type` class variable is a `StateType` instance and is the key to composing f.lux properties to explicitly describe your application when desired. Binding a shadow api to a property type is a central `type` class variable feature.
	
	This step will define several custom f.lux property types: `TodoProperty` and `TodoListProperty`. The `type` class variable `TodoProperty.type` defines how f.lux should shadow each todo item and is setup when defining the `TodoProperty` type. The `TodoListProperty.type` describes how the todos array should be shadowed and will be setup when defining the `TodoListProperty` to shadow each element using `TodoProperty`.
	
	`type` class variables provide the declarative mechanism for describing the shadowing process, are super easy to setup, and will be explored in detail during this step.


### Built-in `Property` types

The f.lux `Store` 'shadows' the application state by recursively mapping the state's values using various `Property` types. The f.lux library provides the following building block types:

| Property class         | Description
| ---------------------- | -------------------------
| `ArrayProperty`        | Full [Array][array-mdn] api and subscript random access, i.e. `arr[1]`
| `IndexedProperty`      | Non-mutable [`Array`][array-mdn] api (`find(), `map()`, `reduce()`,...) and subscript random access
| `MapProperty`          | [`Map`][map-mdn] api plus 'dot' access, i.e. `person.name` or `person['name']
| `ObjectProperty`       | 'dot' access to values with no api beyond `toJSON()`
| `PrimitiveProperty`    | exposes the actual value on parent shadow property access, i.e. `person.name` returns the string value

* `IndexedProperty` vs `ArrayProperty`

	Both types represent arrays with the difference being the portion of the [`Array`][array-mdn] api exposed. `ArrayProperty` exposes the complete api while `IndexedProperty` limits the api to the non-mutating methods, such as `filter()`, `find()`, `indexOf()`, and `map()` to name a few. Both types allow for random access and assignment, such as `todos[1].desc`.
	
	Use `IndexedProperty` when you want to model an array state property without exposing mutating functions like `push()`, `remove()`, and `splice()`. You can then specify a custom shadow api to expose mutation methods that involve implementation logic. 
	
	`IndexedProperty` is used to implement the `TodoListProperty` in this step.
	
* `ObjectProperty` vs `MapProperty`

	Both types represent javascript object with the difference being the exposed api. `MapProperty` exposes the full [`Map`][map-mdn] api for adding, inspecting, and removing properties. `ObjectProperty` is more like a literal javascript object and does not expose a mutation api. Both types allow for random access and assignment using property key names, such `todo.desc` or `todo['desc']`.
	
	Use `ObjectProperty` when you do not need the `Map` api or want to define your own, custom shadow api. For example, use `ObjectProperty` to implement a property exposing the current phone orientation. The orientation may be either landscape or portrait. Allowing the application add and remove properties to an `OrientationProperty` is non-sensical. Instead, base `OrientationProperty` on `ObjectProperty` and expose a shadow api with a function `isLandscape()`. You would use `propertyWillShadow()` and `propertyWillUnshadow()` to register and unregister for phone OS orientation change events, set a state variable based on the events, and the React UI could render the appropriate display by inspecting `orientation.isLandscape()`.

	`ObjectProperty` is used for implementing the `TodoProperty` in this step.
	
	
### Casting a `Shadow`

Specifing a shadow api consists of two steps:

1. **Define the api**

	There are two ways to define shadow api:
	
	- **Subclassing**
	
		```
		class TodoShadow extends Shadow {
			get momentCreated() {
				return moment(this.created);
			}

			isCompleted() {
				return this.completed;
			}
		}
		```
	
	- **Literal object**
	
		```
		const TodoListShadow = {
			get incompleteSize() {
				return this.reduce( (acc, t) => !t.completed ?acc+1 :acc, 0);
			},

			addTodo(desc) {
				return this.push(TodoProperty.create(desc));
			},
			
			// other methods and properties here
		}
		```
		
	In both cases, the `this` reference is the current property shadow state.
	
	
2. **Attach the api to a `Property.type`**

	Each f.lux built-in `Property` type provides a static function for creating a specialized type called `createClasss()` that takes a shadow definition and returns a new type. 
	
	```
	export default IndexedProperty.createClass(TodoListShadow);
	```
	
	This tutorial step will explore additional capabilities of `createClass()` and how to utilized the returned type.
	

### Custom properties

An f.lux property can be created through subclassing in addition to the previously mentioned `createClass()` static function available on each built-in type. The subclassing approach is used when you want to tie into the `Property` life-cycle.

Creating a `Property` subclass requires two steps:

1. **Subclass a built-in type**

	```
	export default class TodoProperty extends ObjectProperty {
		// implementation here
	}
	```

2. **Define the `type` static variable**

	Each built-in type has a `defineType()` static function that will create a `type` static veriable that can be used for configuring the shadowing process. Continuing the `TodoProperty` in step 1:
	
	```
	ObjectProperty.defineType(TodoProperty);
	```

	This tutorial step will explore additional capabilities of `defineType()`.


### Configure the `type`

Configuring the `type` variable is what ties the shadow api to a property and how child property shading is configured. Both `createClass()` and `defineType()` static functions take callback as the second parameter. The callback has the form:

```
function callback(spec)
```

where `spec` is a `StateType` instance.

`StateType` defines the shadowing process for an f.lux property:

* **Shadow type** - the shadow class or javascript literal object definition as described aboe
* **Child property types** - specify child property names and shadow `type`
* **Element type** - specify a `type` for each contained child property or array value
* **Readonly** - shadow state properties may be marked as readonly so assignments will not cause mutations. Handy for readonly properties like object IDs or system defined values like orientation or location.

Let's dive right into this tutorial step and explore these concepts.


### Accessing the `Property` from the `Shadow`

The `Shadow` class is the base class for all f.lux shadow state properties. Its api is quite spartan yet it provides access to wealth of information and capabilities. `Shadow` defines the useful, standard Javascript functions `toJSON()` and `toString()`. Several additional f.lux specific methods are:

* `$()` - returns the 'accessor' used in the previous step to get the unique f.lux `Property` ID: `todo.$().pid()`
* `$$()` - returns the backing `Property` instance

Accessing a shadow's backing `Property` is most often used to access specific capaiblities the `Property` posseses but are not shadowed. In this step we will access `Property` level apis in `IndexedProperty` and `ObjectProperty` for mutating the state, a capability not provided by the parent `Shadow` classes. This is more fully explained in the coding explanations below.
	

## 1. Todo property<a id="todo" />

A todo item will have the following properties:

* `desc` - string describing the task
* `completed` - boolean describing if the task has been completed
* `created` - an ISO 8601 formatted date string for when the item was created
* `updated` - an ISO 8601 formatted date string for when the item was last modified

Dates will be manipulated using the excellent `moment` library.

### Import f.lux types and `moment`

```
import moment from "moment";

import {
	ObjectProperty,
	PrimitiveProperty,
	Shadow,
} from "f.lux";
```


### Create the `TodoProperty` class

The last portion of this tutorial step will involve using the f.lux `Property` life-cycle to set the `updated` child property whenever `desc` or `completed` change. Utilizing the life-cycle requires the subclassing approach. Further, `TodoProperty` does need the `Map` api for mutations so let's extend `ObjectProperty`:

```
export default class TodoProperty extends ObjectProperty {
	static create(desc) {
		const now = moment().toISOString();

		return {
			completed: false,
			created: now,
			desc: desc,
			updated: now,
		}
	}
}
```

A few things worth noting about the class:

* `class TodoProperty extends ObjectProperty { ... }`

	Creating an f.lux `Property` type is as simple as subclassing a built-in `Property` subclass. You can also subclass your own or third party `Property` subclasses though this is not generally a preferred style. The idea being that `Property` subclasses are **data components** and not general purpose business logic class hieararchies.
	
	We will tie into the property life-cycle in the last part of this tutorial step which will involve adding a `propertyChildInvalidated()` method.
	
* `static create(desc) { ... }`

	A static function for creating a new todo item state object. This has nothing to do with f.lux beyond demonstrating how f.lux `Property` classes provide single place, common sense location to put logic related to a state type. Should the expected structure of a todo item change then all changes can be made in a single file.


### Create the `TodoShadow` class

Let's stick with the subclassing theme for creating the shadow api:

```
class TodoShadow extends Shadow {
	get momentCreated() {
		return moment(this.created);
	}

	get momentUpdated() {
		return moment(this.updated);
	}
}
```

* `class TodoShadow extends Shadow { ... }`

	`Shadow` is the base class for all shadow apis when using the subclassing technique. Some built-in f.lux `Property` types have specialized subclasses that you may want to subclass instead. `ObjectProperty` uses `Shadow` as its default shadow class if you do not specify one.
	
* `momentCreated` and `momentUpdated` virtual properties

	The `created` and `updated` properties are strings yet the UI need the times in a format suitable for sorting and filtering. To that end, we create two virtual properties that return `moment` objects created using the f.lux child properties. Notice how 
	
	```
	return moment(this.created);
	``` 
	uses the `this` reference:
	
	- `this` - refers to the f.lux shadow state for the todo item
	- `created` - the child f.lux shadow state property
	
	The UI can then access the virtual properties:
	
	```
	sortBy(todos, t => -t.momentCreated.valueOf() )
	```
	
	**Key F.lux Concept: Shadow api methods use the `this` reference to access the shadow state.** 
	
* Define `TodoProperty.type` 

	The easiest way to define the `type` descriptor is to use the `defineType()` static function in your built-in `Property` parent class:
	
	```
	ObjectProperty.defineType(TodoProperty, TodoShadow, type => {
		type.properties({
					completed: PrimitiveProperty.type.initialState(false),
					created: PrimitiveProperty.type.readonly,
					desc: PrimitiveProperty.type,
					updated: PrimitiveProperty.type.readonly,
				})
			.readonlyOff
			.typeName("TodoProperty");
	});
	```

	where `defineType()` parameters are:
	
	- `TodoProperty` - the `ObjectProperty` subclass (not an instance)
	- `TodoShadow` - a `Shadow` subclass or object literal
	- `callback(type)` - callback for specializing the `StateType` instance to be used for the `type` descriptor
	
	Notice the callback does not return a value since the `type` parameter is a `StateType` instance is mutated by configuration methods and properties. Not very functional but it allows for chaining calls as demonstrated above: `type.properties({}).typeName("")`
	
	
	* `type.properties({ ... })`
	
		Method used to configure the child properties. Autoshadowing will shadow the current state but does not provide any control over the shadowing process. `properties({}) gives you a chance to specify how each property should be shadowed and provides support for assigning values to state properties that are currently `undefined`.
		
	* `desc: PrimitiveProperty.type`
	
		Our first glimpse at using the `type` descriptor. Each f.lux built-in class has a `type` static variable and in this case we are specifying the `desc` property will be a Javascript primitive (boolean, string, or number). This mimics exactly what the autoshadowing process would generate. Just like React component `propTypes`, it never hurts to be explicit about data expectations.
		
	* `completed: PrimitiveProperty.type.initialState(false)`
	
		Here we are specifying an initial value for the `completed` property using the `StateType.initialState(value)` method.
	
	* `created: PrimitiveProperty.type.readonly`
	
		The `created` property is declared as readonly to prevent an assignment in application code from changing the value. This is accomplished using the `StateType.readonly` property. Notice `readonly` is not a function yet is still chainable so this would work:
		
		```
		PrimitiveProperty.type.readonly.initialState(moment().toISOString())
		```

## 2. Todo list property<a id="todos" />

	The `TodoListProperty` will be an `IndexedProperty`. Remember, `IndexedProperty` shadows an array and exposes the `Array` api **minus** the mutation methods, such as `push()`, `pop()`, and `splice()`. We are going to add additional shadow methods and properties that will be of use to the React UI:
	
	- `incompleteSize` property - a virtual property providing the number of incomplete todo items
	- `addTodo(desc)` - takes a todo description and appends a new todo item to the array
	- `removeTodo(todo)` - takes a `TodoProperty` and removes it from the array

### Create the `TodoListShadow`

The `IndexedProperty` uses the `IndexedShadow` as its default shadow type. By defining the `TodoListShadow` using an object literal approach we do not have to worry about subclassing the correct `Shadow` subclass.

```
const TodoListShadow = {
	get incompleteSize() {
		return this.reduce( (acc, t) => !t.completed ?acc+1 :acc, 0);
	},

	addTodo(desc) {
		const listProp = this.$$();

		listProp._indexed.push(TodoProperty.create(desc));
	},

	removeTodo(todo) {
		const listProp = this.$$();
		const idx = this.indexOf(todo);

		if (idx !== -1) {
			listProp._indexed.remove(idx);
		}
	}
}
```

A few points of interest:

* `const listProp = this.$$();`

	Occassionally, a shadow method requires access to the back `Property` instance. This is accomplished using the `Shadow` class defined method `$$()`. All shadow state properties have this method. 

* `listProp._indexed.push(TodoProperty.create(desc))`

	`IndexedShadow` does not provide mutation methods but `IndexedProperty` does provide this super power through the `_indexed` instance variable. `TodoListProperty` is defined as an `IndexedProperty` via the `IndexedProperty.createClass(TodoListShadow, type => {...})` declaration.

* `listProp._indexed.remove(idx)`

	And this takes advantage of the `_indexed.remove()` function.

* `incompleteSize` virtual property

	A lot to take in for a one line getter. `incompleteSize` is a virtual property defined using the es2015 `get` keyword like `momentCreated` property in `TodoProperty`. The property body is more interesting:
	
	```
	return this.reduce( (acc, t) => !t.completed ?acc+1 :acc, 0);
	```
	
	- `this.reduce(callback)` uses the `Array.reduce()` function provided by the `IndexedShadow` referenced through `this`.
	- each iteration passes a todo item along with the accumulator value: `(acc, t) => !t.completed ?acc+1 :acc`. This code adds one to the accumulator if the todo item's `completed` flag is false: `!t.completed`.
	
	**Key F.lux Concept: When working with f.lux shadow types the `this` reference always references the shadow state and not the actual state of the `Store`. This means any changes to the shadow state will be asynchronously reflected in the actual state followed by a `Store` change notification being sent to all registered callbacks.**


### Create the `TodoListProperty`

`TodoListProperty` is created without resorting to subclassing as there is no need to access the property life-cycle. This is accomplished with:

```
export default IndexedProperty.createClass(TodoListShadow, type => {
	type.elementType(TodoProperty.type)    
		.typeName("TodoListProperty")      
});
```

Each f.lux built-in type provides a static `createClass()` function for creating a `Property` subclass with a `type` descriptor attached.

The parameters are:
	
- `TodoListShadow` - the shadow type for the new property type. This parameter can also be an `IndexedShadow` subclass in this case.
- `callback(type)` - configure the shadowing behavior.

The new twist here is:

```
type.elementType()
``` 

`StateType.elementType(type)` specifies the f.lux type used to shadow each element. Thus, `type.elementType(TodoProperty.type)` instructs f.lux to use the `TodoProperty` for shadowing each element.


## 3. Create root property<a id="root" />

The f.lux `Property` type for the root state is the simplest property. 


### Create `TodoRootProperty` 

Like `TodoProperty`, the root property is an `ObjectProperty` yet it does not tie into the `Property` life-cycle so does not use subclassing and does not provide a customized api.

```
export default ObjectProperty.createClass({}, type => {
	type.autoshadowOff                          
		.properties({                           
				todos: TodoListProperty.type,   
			})
		.readonly                               
		.typeName("TodoRootProperty");          
});
```	

There are a few new wrinkles worth discussing:

* `type.autoshadowOff` - the f.lux shadowing process will only process explicitly defined properties
* `type.readonly` - recursively marks all descendent properties as readonly unless a property `type` descriptor marks the property using `readonlyOff`. This is why `TodoProperty.type` has is defined using `readonlyOff`. Take a quick look if you did not notice above. Marking the property as readonly ensure the `todos` array is not reassigned:

```
root.todos = [];       // this will have not affect
```

### Create the `Store` using `TodoRootProperty`

Using `TodoRootProperty` as the basis for the shadow state requires a small change to `main.js`:

```
const root = new TodoRootProperty();
const store = new Store(root);
```


## 4. Update UI to use `TodoListProperty` and `TodoProperty`<a id="ui" />

### `Todos.react.js`

Improve `todos` sorting for rendering the `<TodoItem>` components by sorting incomplete items first and a secondary sorting on the `todo.created` date. Change the following portion of `renderTodos()` from:

```
return todos
	.sortBy('completed')
	.map( t => <TodoItem key={ t.$().pid() } todo={ t } todos={ todos } /> );
```

to the more advanced:

```
return todos
	.sortBy([ 'completed', t => -t.momentCreated.valueOf() ])
	.map( t => <TodoItem key={ t.$().pid() } todo={ t } todos={ todos } /> );
```

This code uses the `TodoProperty` virtual property `momentCreated` for the secondary sorting criteria.


### `AddTodo.react.js`

Utilize the `TodoListShadow.addTodo(desc)` function to append a new todo item. Remember, `TodoListProperty` is an `IndexedProperty` and so the array does not have `push()` or `unshift()` mutation functions. The only way to add new todo item is through `addTodo()`.

Change the `<AddTodo>` component method `addTodo()` from:

```
const todo = {
	completed: false,
	desc,
	created: moment().toISOString()
}

// add the Todo item to the array
todos.push(todo);
```

to the much simpler

```
todos.addTodo(desc);
```

Notice how the f.lux properties easily removes the 'business logic' in a very natural way.

### `TodoItem.react.js`

Utilize the `TodoListShadow.removeTodo(todo)` function to remove a todo item. The `todos` shadow state array does not have a `remove()` function since `IndexedProperty` does not provide `Array` mutation methods.

Change `<TodoItem> component function removeTodo()` from:

```
const idx = todos.indexOf(todo);

if (idx !== -1) {
	todos.remove(idx);
}
```

to the much nicer:

```
todos.removeTodo(todo);
```


## 5. Track todo item update time<a id="update" />

You will most often be interested in knowing when your f.lux `Property` types are shadowed and unshadowed so you can register/unregister for interesting events, manage timers, or setup/teardown network connections. In this case, we want to set the `updated` property each time a `TodoProperty` `desc` or `completed` property changes. Implement the 

```
propertyChildInvalidated(childProperty, sourceProperty)
```

method in your `Property` subclass to be notified each time a descendent property value **is going to change**. The parameters are:

* `childProperty` - the immediate child property from where the change is coming
* `sourceProperty` - the property that is actually changing

In our case, the `TodoProperty` child properties are all primitive so we are not concerned about 'bubbling' property change notifications and will deal with the `childProperty` parameter.

Keep in mind, we are now working in the `Property` class and not a `Shadow` class. The `this` reference now points to the `Property` and not the shadow state. Here is the `TodoProperty` implementation:

```
propertyChildInvalidated(childProperty, sourceProperty) {
	const childName = childProperty.name();

	if (childName === "completed" || childName === "desc") {
		// _keyed is defined in ObjectProperty and provides a non-shadowed api for working with
		// child properties. We use the api to 'set' a readonly property value
		this._keyed.set("updated", moment().toISOString());
	}
}
```

Ok, there is some new stuff here:

* `const childName = childProperty.name()`

	`name()` is a `Property` base class method returning the property name. We use the `childProperty.name()` value to determine if the `desc` or `completed` properties changed. If so, then we set a new value on the `updated` child property.

* `this._keyed.set("updated", moment().toISOString())`

	It's been a while so here is the definition for `updated`:
	
	```
	updated: PrimitiveProperty.type.readonly
	```
	
	The `readonly` property means assignment (`=`) cannot be used to set a new value. `ObjectProperty` provides a non-shadowed (hidden) api for mutating a property's state. The api is available through the inherited `_keyed` instance variable and is of type `KeyedApi`. Thus, the `updated` property value can be changed:
	
	```
	this._keyed.set("updated", moment().toISOString())
	```
	

[Step 3: Time travel debugger](step-3.md)


[array-mdn]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[map-mdn]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map