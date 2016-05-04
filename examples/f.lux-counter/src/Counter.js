import React from "react";

export default /* Counter */ React.createClass({
	componentWillMount() {
		this.props.store.subscribe(this.onStateChange);
	},

	componentWillUnmount() {
		this.props.store.unsubscribe(this.onStateChange);
	},

	/*
		Store subscribe callback for each time state changes.
	*/
	onStateChange() {
		this.forceUpdate();
	},


	onStart(event) {
		const { counter } = this.props.store.shadow;

		counter.start();
	},

	onStop(event) {
		const { counter } = this.props.store.shadow;

		counter.stop();
	},

	onReset(event) {
		const { counter } = this.props.store.shadow;

		counter.reset();
	},

	render() {
		const { counter, log } = this.props.store.shadow;
		const btnStyle = {
			marginRight: 15,
			padding: "5px 10px",
			fontSize: 15
		}
		var actionIdx = 1;

		return <div>
				<h1>
					Count: { counter.count }
				</h1>
				<button onClick={ this.onStart } style={ btnStyle }>Start</button>
				<button onClick={ this.onStop } style={ btnStyle }>Stop</button>
				<button onClick={ this.onReset } style={ btnStyle }>Reset</button>

				<hr />

				<h3 style={{ marginTop: 30, marginBottom: 10 }}>Log - { log.length } entries</h3>
				<ul>
					{
						log.map( a => {
								return <li key={actionIdx++}>{ `${a.action} counter @ ${a.time}`}</li>
							})
					}
				</ul>
			</div>
	}
});
