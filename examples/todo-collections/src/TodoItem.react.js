import classnames from "classnames";
import React, { Component } from "react";


/*
	Component for a single TodoProperty.

	Noteworthy features:
		* handleDestroy() - Uses the shadow accessor ('$()') to destroy the todo property. All shadow
			properties have an accessor and properties contained in a collection have a superset of
			capabilities, including isDirty(), isNew(), remove(), save().
		* handleDescChange() - demonstrates updating a property value using assignment
			'todo.desc = event.target.value;' (this will trigger a store update) and using
			'store.updateNow()' to synchronously perform state updates. Updates normally happen on the
			next javascript tick. This technique is usually used in network callbacks but is handy here
			to prevent cursor jumping.
*/
export default class TodoItem extends Component {
	handleDestroy() {
		const { todo } = this.props;

		// Use the accessor, $(), to destroy the object in the collection and at endpoint
		// Note: this method available on all todo subproperties as well when they are
		//     complex (arrays or objects)
		todo.$().destroy()
			.catch( error => alert(`Unable to destroy todo.\n\n${todo.desc}`))
	}

	handleDescBlur() {
		const { todo } = this.props;

		todo.$().save();
	}

	handleDescChange(event) {
		const { store, todo } = this.props;

		// set the <input> value on the todo 'desc' shadow property. This will create an update
		// action to set the new value. Remember, 'todo' is an instance of TodoShadow.
		todo.desc = event.target.value;

		// Synchronously update the state otherwise react/dom will push cursor to the end if inserting text.
		// There is performance overhead since all registered store listeners are notified but this app is
		// small assuming not too many todos.
		//
		// Alternatively, you can track the cursor and manually set in componentDidUpdate() or just use the
		// f.lux-react FluxInput component which performs cursor fixups (see todo example in f.lux-react
		// module)
//		store.updateNow();
	}

	handleToggleCompleted() {
		const { todo } = this.props;

		// toggle the completed flag
		todo.completed = !todo.completed;

		// save on each toggle
		todo.$().save();
	}

	render() {
		const { todo } = this.props;
		const { completed, desc } = todo;
		const descClasses = classnames("todoItem-desc", {
				"todoItem-descCompleted": completed
			});
		const completedClasses = classnames("todoItem-completed fa", {
				"fa-check-square-o todoItem-completedChecked": todo.completed,
				"fa-square-o": !completed,
			});

		return <div className="todoItem">
				<i className={ completedClasses } onClick={ () => this.handleToggleCompleted() } />

				<input
					type="text"
					className={ descClasses }
onChange={ event => todo.desc = event.target.value }
//					onChange={ event => this.handleDescChange(event) }
					onBlur={ () => this.handleDescBlur() }
					defaultValue={ desc }
				/>

				<i className="todoItem-delete fa fa-times" onClick={ () => this.handleDestroy() }/>
			</div>
	}
}