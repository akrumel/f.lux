# Store: Simple object store creation

## Objective

This is the "Hello, World!" of f.lux stores. This recipe creates a store based on an object with no specialization. The state will be autoshadowed with full read-write enabled for all shadow state properties. This approach is useful to get up and running quickly and then iterating to specialize the properties as needed.


## Code

```javascript
import { Store, MapProperty } from "f.lux";

const root = new MapProperty();
const state = { todos: [] }
const store = new Store(root, state);

const rootShadow = store._;  // or store.shadow;

console.log("Todos length: ", rootShadow.todos.length);
```


## Explanation

### `const root = new MapProperty();`

Creates a `MapProperty` that will serve as the root `Property` for the shadow state. This means the root shadow state will adher to the [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) api. And you can access the root's properties using normal javascript 'dot' syntax as shown in the `console.log()` line.


### `const state = { todos: [] }`

The store's state will start out as a simple object with an array in the `todos` property.


### `const store = new Store(root, state);`

The `Store` constructor is:

> `constructor(root, state, useTransients=true)`

The `root` parameter must be a `Property` subclass instance and the `state` must be an appropriate javascript structure for the `root` type.

The `useTransients` default value is fine as this recipe does not depend on that feature.


### `const rootShadow = store._;`

The store's shadow state is available through the `shadow` or `_` getters. You can then interact with the shadow state to generate update actions and manipulate the actual state.


### `console.log("Todos length: ", rootShadow.todos.length);`

The `todos` shadow state implements the [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) api so you can assign values to indices and call methods such as map(), push(), pop(), and remove(). There are some restrictions, as outlined in the upcoming Developer's Guide, but will not usually affect the way you write application logic.


---

[TOC](../README.md) > [Store
](README.md)