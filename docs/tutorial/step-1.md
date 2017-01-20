# Step 1: F.lux Store and Basic Todo Functionality

## Goals

1. [Create a f.lux `Store` with initial state](#user-content-store)
2. [Subscribe to store changes in `<Todos>`](#user-content-changes)
3. [Implement `<AddTodo>` `addTodo()` function](#user-content-addtodo)
4. [Implement `<TodoItem>` to display, edit, and delete todo items](#user-content-items)
5. [Iterate all store todo items and create a `<TodoItem>` for each one](#user-content-iterate)


## Technical background



## Create a f.lux `Store` with initial state<a name="store" />

Add the following lines to `main.js`:

```js
import {
	Store,
	ObjectProperty
} from "f.lux";


// create the store and starting state
const root = new ObjectProperty();
const state = { todos: [] }
const store = new Store(root, state);
```

A f.lux based application uses a single store for managing all state. A `Store` instance is created by specifying a root property and the initial state. The property must be a `Property` subclass and the state a JSON compatible value of appropriate type for the root `Property`. In this case, an `ObjectProperty` instance is used to shadow, or proxy, a javascript literal object representing the application state. `ObjectProperty` is used to represent javascript literal objects.

Out of the box, f.lux will recursively 'autoshadow' the state to automatically map `Property` types onto the application state. Autoshadowing performs the following javascript type to f.lux type mapping:

| Javascript type              | f.lux `Property` subclass | API
| ---------------------------- | ------------------------- | -------------------------------
| Array.isArray(type)          | `ArrayProperty`           | [Array]
| lodash.isPlainObject(type)   | 'MapProperty'             | [Map]
| all others                   | `PrimitiveProperty`       | exposes the actual value

Drilling down into the initial state and adding an initial todo item:
```js
{
	todos: [
    	{ desc: "Just do it!", completed: false }
	]
}
```

* `todos`: `ArrayProperty`
* `todos` elements: `MapProperty` since these will be objects with a `desc` and `completed` flag
* `comp`: `PrimitiveProperty` will shadow the todo item's `string` property
* `completed`: `PrimitiveProperty` will shadow the todo item's `boolean` property

F.lux then allows you to use normal Javascript coding syntax to access and manipulate the shadow state. The shadow state is immutable so all mutations, whether through assignment or functions/methods will generate f.lux actions that will change the actual state and generate store change notifications to registered listeners. Some examples of code used in this step that will be described in detail in the following sections:

* `Array.map()`

```
todos.map( t => <TodoItem todo={ t } todos={ todos } /> )
```

* JSX `<input defaultValue={ .... } onChange={ event => ... } />`

```jsx
<input type="text"
	onChange={ event => todo.desc = event.target.value }
	defaultValue={ todo.desc }
/>
```

* `Array.indexOf()` and `Array.remove()`

```js
export default class TodoItem extends Component {
	removeTodo() {
		const { todo, todos } = this.props;
		const idx = todos.indexOf(todo);

		if (idx !== -1) {
			todos.remove(idx);
		}
	}


	render() {
		...
	}
}
```

The final change to `main.js` is to pass the `store` to the `<Todos>` component using:

```jsx
ReactDOM.render(
	<Todos store={ store }/>,
	document.getElementById('react-ui')
);
```


## Subscribe to store changes in `<Todos>`<a id="changes" />



## Implement `<AddTodo>` `addTodo()` function<a id="addtodo" />



## Implement `<TodoItem>` to display, edit, and delete todo items<a id="items" />



## Iterate all store todo items and create a `<TodoItem>` for each one<a id="iterate" />


[Step 2: Properties](step-2.md)


[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
