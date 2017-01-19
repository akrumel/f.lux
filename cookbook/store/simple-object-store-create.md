# Store: Simple object store creation

## Objective

This is the "Hello, World!" of f.lux stores. This recipe creates a store based on an object with no specialization. The state will be autoshadowed with full read-write enabled for all shadow state properties. This approach is useful to get up and running quickly and then iterating to specialize the properties as needed.


## Code

```javascript
import { Store, MapProperty } from "f.lux";

const root = new MapProperty();
const state = { todos: [] }
const store = new Store(root, state);

const rootShadow = store._;

console.log("Todos length: ", rootShadow.todos.length);
```

## Explanation

### `const root = new MapProperty();`


### `const state = { todos: [] }`


### `const store = new Store(root, state);`


### `const rootShadow = store._;`


### `console.log("Todos length: ", rootShadow.todos.length);`



---

[Back](README.md)
[TOC](../README.md)