import classnames from "classnames";
import React, { Component } from "react";


export default class TodoItem extends Component {
	handleDestroy() {
		const { todo } = this.props;

		todo.$().destroy()
			.catch( error => alert(`Unable to destroy todo.\n\n${todo.desc}`))
	}

	updateDesc(event) {
		const { store, todo } = this.props;

		todo.desc = event.target.value;

		// Synchronously update the state otherwise react/dom will push cursor to the end if inserting text.
		// There is performance overhead since all registered store listeners are notified but this app is
		// small assuming not too many todos.
		//
		// Alternatively, you can track the cursor and manually set in componentDidUpdate() or just use the
		// f.lux-react FluxInput component which performs cursor fixups (see todo example in f.lux-react
		// module)
		store.updateNow();
	}

	render() {
		const { todo } = this.props;
		const descClasses = classnames("todoItem-desc", {
			"todoItem-descCompleted": todo.completed
		});
		const completedClasses = classnames("todoItem-completed fa", {
			"fa-check-square-o todoItem-completedChecked": todo.completed,
			"fa-square-o": !todo.completed,
		})

		return <div className="todoItem">
				<i className={ completedClasses } onClick={ () => todo.completed = !todo.completed } />

				<input
					type="text"
					className={ descClasses }
					onChange={ event => this.updateDesc(event) }
					value={ todo.desc }
				/>

				<i className="todoItem-delete fa fa-times" onClick={ () => this.handleDestroy() }/>
			</div>
	}
}