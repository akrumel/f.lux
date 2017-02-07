# Step 4: `f.lux-react`

## Overview

This step will will demonstrate using the `f.lux-react` module streamline access to the f.lux `Store` and its shadow state properties.


## Goals

1. [`<Provider>`](#user-content-provider)
2. [`<AddTodo>`](#user-content-addtodo)
3. [Simplify `<Todos>` Top-Level Component](#user-content-todos)
4. [`<Header>`](#user-content-header)
5. [`<TodosList>`](#user-content-todolist)
6. [`<Toolbar>`](#user-content-toolbar)


The [`examples/tutorial/step-4`](https://github.com/akrumel/f.lux/tree/master/examples/tutorial/step-4) directory contains the completed code for this step.


## Technical background

### `f.lux-react`

The `f.lux-react` module was inspired by the `redux-react` module for providing React bindings. Using `f.lux-react` removes the need for you to hand code:

1. Registering for `Store` change notificiations
2. Passing shadow properties from the top-level component through the entire hierarchy

`f.lux-react` contains components and functions to:

* Install the `Store` on the [React context](https://facebook.github.io/react/docs/context.html)
* Create container components for extracting and passing `Store` shadow state values as component properties
* Form component support for easily interfacing data entry components with f.lux properties

This tutorial step will utilize the following `f.lux-module` exports:

* `<Provider>`

    An application top-level component that places the `Store` on the React context. `<Provder>` expects a single property:
    
    - `store` - the application f.lux `Store`
    

* `storeContainer()`

    Connects a React component to the f.lux `Store`. This method takes a number of parameters used to configure how the container component's sets up properties for your component. It actually returns a function that takes your component and returns the container component to use in your application. 

    `storeContainer()` is a complex function but we are going to use it in a simple manner and just pass it a single parameter:
    
    - `mapShadowToProps` 
        
        Extracts values from the f.lux store's shadow state and returns them as a javascript object. The object will be merged with the component's props and set on your component. `mapShadowToProps()` is a function of the form:
        
        ```js
        function callback(shadow, props, store) : stateProps
        ```
    
    Here is an example used in this tutorial step:
        
    ```js
    function mapShadowToProps(shadow) {
        return {
            todos: shadow.todos,
        }
    }
    
    export default storeContainer(mapShadowToProps)(AddTodo);
    ```
    
    Explanation:
    
    - `function mapShadowToProps(shadow) {...}
        The `mapShadowToProps()` function is called when a store change notification is received to get the latest shadow state based props. This implementation returns an object with a single `todos` property.
        
    - `storeContainer(mapShadowToProps)`
        Generates a factory function that takes your React component as its sole parameter to return the f.lux connected component
        
    - `(AddTodo)`
        Uses the function returned by `storeContainer()` to create the f.lux connected component
    
    
    This will be shortened in the application to:
    
    ```js
    export default storeContainer( shadow => ({ todos: shadow.todos }) )(AddTodo);
    ```
    
    

## 1. `<Provider>` <a id="provider"/>

Using the `<Provider>` component to place your `Store` instance on the React context is straight-forward. Here is the pertitent code in `main.js`:

```jsx
import { Provider } from "f.lux-react";

ReactDOM.render(
    <Provider store={ store }>
        <Todos/>
    </Provider>,
    document.getElementById('react-ui')
);
```

Essentially, we just wrapped the application's top-level component, `<Todos>`, in a `<Provider>`.


## 2. `<AddTodo>` <a id="addtodo"/>

The `<AddTodo>` component expects a `todos` prop that contains a reference to the `todos` shadow state property. Previously, this was passed by the `<Todos>` component. We can use `storeContainer()` instead:

```jsx
class AddTodo extends Component { ... }

export default storeContainer( shadow => ({ todos: shadow.todos }) )(AddTodo);
```

No `<AddTodo>` changes are required since the f.lux connected component is exported and used in `<Todos>` as shown in the next section.


## 3. Simplify `<Todos>` Top-Level Component <a id="todos"/>

Refactoring the other components allows for `<Todos>` to be greatly simplified. Previous versions contains the code to register/unregister from the f.lux store. In fact, we are also going to extract the header, item list, and toolbar into separate components yeilding a simple functional component: 

```jsx
import React from "react";

import AddTodo from "./AddTodo.react";
import Header from "./Header.react";
import TodoList from "./TodoList.react";
import Toolbar from "./Toolbar.react";


export default function Todos(props, context) {
    return <div className="todoContainer">
            <Header />

            <AddTodo />
            <TodoList />

            <Toolbar />
        </div>
}
```

Notice how the top-level `<Todos>` component no longer references the `store` prop. The following sections will discuss the new components: `<Header>`, `<TodoList>`, and `<Toolbar>`.


## 4. `<Header>` <a id="header"/>

The application header is an `<h1>` tag that shows the number of incomplete items. The code is extracted from the `<Todos> render()` function and placed in the `<Header>` functional component:

```jsx
import pluralize from "pluralize";
import React from "react";

import { storeContainer } from "f.lux-react";


function Header(props, context) {
    const { todos } = props;
    const remainingText = `${ todos.incompleteSize } ${ pluralize("item", todos.incompleteSize ) } remaining`;

    return <h1>
            F.lux Todos <small>{ remainingText }</small>
        </h1>
}


export default storeContainer( shadow => ({ todos: shadow.todos }) )(Header);
``` 


## 5. `<TodosList>` <a id="todolist"/>

The previous steps rendered the todo items from the `<Todo> renderTodos()` method. This becomes another simple functional component:

```jsx
import React from "react";

import { storeContainer } from "f.lux-react";

import TodoItem from "./TodoItem.react";


function TodoList(props, context) {
    const { todos, ui } = props;
    const visibleTodos = ui.visibleTodos();

    if (todos.length === 0) {
        return <p className="noItems">What do you want to do today?</p>
    } else if (visibleTodos.length === 0) {
        return <p className="noItems">No items are { ui.filter }</p>
    }

    return <div>
        {
            visibleTodos.map( t => <TodoItem key={ t.$().pid() } todo={ t } todos={ todos } /> )
        }
        </div>
}


export default storeContainer( shadow => shadow )(TodoList);
```

The one wrinkle here is the `mapStateToProps()` function:

```js
shadow => shadow
```

`storeContainer()` will merge the object with the explicitly set component props with the result being the `shadow.todos` and `shadow.ui` properties will be passed as `todos` and `ui` props. You would not usually want all of the shadow root state child properties passed as props but things are pretty simple here. The component then obtains references to `todos` and `ui`:

```js
const { todos, ui } = props;
```

## 6. `<Toolbar>` <a id="toolbar"/>

You do not wrap every component using `storeContainer()` because that introduces unnecessary overhead. The goal is to strike a balance between manually passing the store and/or shadow state through the entire hieararchy and wrapping every component. Toolbar demonstrats getting the `ui` shadow state property using `storeContainer()` and then passing it to the `<FilterSelector>` and `<SortSelector>`.

```jsx
import React from "react";

import { storeContainer } from "f.lux-react";

import FilterSelector from "./FilterSelector.react";
import SortSelector from "./SortSelector.react";


function Toolbar(props, context) {
    const { ui } = props;

    return <div className="tools">
            <FilterSelector ui={ ui } />
            <SortSelector ui={ ui } />
        </div>
}


export default storeContainer( shadow => ({ ui: shadow.ui }) )(Toolbar);
```

No changes are required for `<FilterSelector>` and `<SortSelector>` to continue functioning as in the [previous step](step-3.md).


## Final Thoughts

This tutorial step covered using the `f.lux-react` module to simplify the application's React components.

Important concepts include:

* `<Provider>` - application top-level React component puts the `Store` on the context
* `storeContainer(mapShadowToProps)` - creates a higher order component to provide desired shadow state values as component properties.


## Next Step

[Step 5: Time travel debugger](step-5.md)
