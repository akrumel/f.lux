import uuid from "uuid";
import autobind from "autobind-decorator";
import has from "lodash.has";
import invariant from "invariant";
import isFunction from "lodash.isfunction";
import isEqual from "lodash.isequal";
import isString from "lodash.isstring"
import sortBy from "lodash.sortby";
import result from "lodash.result";

/*
	Todo:
		- Time travel
		- realtime loggin flags: updates and actions (with path filters)
*/

const HELP_MSG = `f.lux logger commands:
\tback          - moves backward in time by one store state frame
\tclear         - removes all logs
\tforward       - moves forward in time by one store state frame
\thelp          - f.lux logger commands
\tindex         - active index of store state frames
\tmaxFrames     - # of store updates to cache (default=50)
\tprint         - print logs to console
\tprintNoState  - print logs to console without state objects
\tsize          - # of store state frames available
\tstore         - gets the f.lux store
\nFunctions:
\tclearTrap(name)                    - clears a trap set by 'setTrap()'
\tgoto(idx)                          - move to a specific store state frame
\tsetMaxFrames(maxFrames)            - set the maximum number of store states to maintain (default=50)
\tsetTrap(cond, value, name=uuid)    - sets a debugger trap and returns name. conditino argument may be
\t                                     a function taking next state or a string path to get a value
\ttail(count=10, printState=true)    - prints last 'count' store updates
\n
f.lux log available at window.`;

export default class Logger {
	constructor(store, name="flog") {
		this.store = store;
		this.name = name;
		this.nextFrameId = 1;
		this.filter = null;
		this.frames = [];
		this.maxFrames = 50;
		this.traps = null;

		this.activeFrame = new LogFrame(store, this.nextFrameId++);

		this.activeFrame.captureState();
		this.frames.push(this.activeFrame);

		this.currFrame = new LogFrame(store, this.nextFrameId++);

		window[name] = this.console = createConsoleLogger(this);

		// print help message to console
		this.console.help;
	}

	clear() {
		this.activeFrame = new LogFrame(store, this.nextFrameId++);
		this.activeFrame.captureState();

		this.frames = [ this.activeFrame ];
		this.currFrame = new LogFrame(store, this.nextFrameId++);
	}

	clearTrap(name) {
		if (!this.traps) { return }

		delete this.traps[name];

		if (Object.keys(this.traps).length === 0) {
			this.traps = null;
		}
	}

	print(printState=true) {
		const frames = this.frames;

		console.log(`f.lux log`);

		for (let i=0, frame; frame=frames[i]; i++) {
			frame.print(this.filter, frames[i-1], printState);
		}

		if (this.currFrame.actions.length) {
			console.log(`\nf.lux log current frame:`);
			this.currFrame.print(null, null, printState);
		}

		console.log("\n\n");
	}

	setActionFilter(filter) {
		if (filter instanceof RegExp) {
			this.filter = af => filter.test(`${af.impl.dotPath()}::${af.action.name}`);
		} else {
			this.filter = filter;
		}
	}

	setMaxFrames(maxFrames) {
		this.maxFrames = maxFrames;

		this.truncateFrames();
	}

	setTrap(condition, value, name=uuid()) {
		invariant(isFunction(condition) || isString(condition), "Traps must be either a regular expression or function");

		this.traps = this.traps || {};

		this.traps[name] = {
			eval: condition,
			name: name,
			value: value
		}

		return name;
	}

	tail(count=10, printState=true) {
		const frames = this.frames;
		const start = frames.length>count ?frames.length - count :0;
		var prevFrame;

		console.log(`f.lux tail - count=${count}, printState=${printState}`);

		for (let i=start, frame; frame=this.frames[i]; i++) {
			frame.print(this.filter, prevFrame, printState);
			prevFrame = frame;
		}
	}

	//******************************************************************************************************************
	//  Store listener methods
	//******************************************************************************************************************

	@autobind
	onError(store, msg, error) {
		// mark current active frame as not active
		this.activeFrame.active = false;

		this.currFrame.onError(msg, error);
		this.frames.push(this.currFrame);
		this.truncateFrames();

		this.activeFrame = this.currFrame;
		this.currFrame = new LogFrame(store, this.nextFrameId++);

		console.warn(`Store error: msg=${msg}, error=${error}`);
		error && error.stack && console.warn(error.stack);
	}

	@autobind
	onPostStateUpdate(store, action, impl) {
		this.currFrame.addAction(action, impl);

		if (this.traps) {
			const traps = Object.values(this.traps);
			const nextState = store.shadow.__().nextState();

			for (let i=0, t; t=traps[i]; i++) {
				var value = isString(t.eval)
					?result(nextState, t.eval)
					:t.eval(nextState)

				if (isEqual(value, t.value)) {
					debugger;

					this.clearTrap(t.name);
				}
			}
		}
	}

	@autobind
	onPostUpdate(store, time, currState, prevState) {
		const activeIdx = this.frames.indexOf(this.activeFrame);

		// remove all frames after current active frame (time travel occured)
		if (activeIdx < this.frames.length - 1) {
			this.frames = this.frames.slice(0, activeIdx + 1);
		}

		// mark current active frame as not actives
		this.activeFrame.active = false;

		// complete the current frame and mark active then create a new current frame
		this.currFrame.completed(time, currState);
		this.frames.push(this.currFrame);
		this.truncateFrames();

		this.activeFrame = this.currFrame;
		this.currFrame = new LogFrame(store, this.nextFrameId++);
	}


	//******************************************************************************************************************
	//  private methods
	//******************************************************************************************************************

	truncateFrames() {
		if (this.maxFrames > 0 && this.maxFrames < this.frames.length) {
			this.frames = this.frames.slice(this.frames.length - this.maxFrames);
		}
	}


	//******************************************************************************************************************
	//  time travel
	//******************************************************************************************************************

	get index() {
		return this.frames.indexOf(this.activeFrame);
	}

	get size() {
		return this.frames.length;
	}

	back() {
		if (this.index === 0) { return }

		this.goto(this.index - 1);
	}

	forward() {
		if (this.index + 1 === this.size) { return }

		this.goto(this.index + 1);
	}

	goto(idx) {
		if (idx === this.idx) {
			return
		} else if (idx < 0 || idx >= this.size) {
			console.log(`Time travel error - invalid index: ${idx}`)
		}

		const currActiveFrame = this.activeFrame;
		const nextActiveFrame = this.frames[idx];
		const store = this.store;
/*
	Questions:
		will this fire any listener methods and mess things up?
*/
		store.changeState(nextActiveFrame.state, true, nextActiveFrame.time);

		currActiveFrame.active = false;
		nextActiveFrame.active = true;

		this.activeFrame = nextActiveFrame;
	}
}

export class LogFrame {
	constructor(store, id) {
		this.id = id;
		this.store = store;
		this.actions = [];
		this.active = false;
	}

	activate() {
		invariant(has(this, state), "LogFrame does not have a state");

		this.store.changeState(this.state, true);
		this.active = true;
	}

	addAction(action, impl) {
		this.actions.push(new FrameAction(action, impl));
	}

	captureState() {
		this.state = this.store.state;
		this.active = true;
		this.time = this.store.updateTime;
		this.captureTime = new Date();
	}

	completed(time, currState) {
		this.time = time;
		this.state = currState;
		this.active = true;
		this.captureTime = new Date();
	}

	inactivate() {
		this.active = false;
	}

	onError(msg, error) {
		this.state = this.store.state;
		this.active = true;
		this.msg = msg;
		this.error = error;
		this.captureTime = new Date();
	}

	print(filter=null, prevFrame, printState=true) {
		var when = !this.captureTime
			?"n/a"
			:!prevFrame ?this.captureTime.toLocaleString() :`+${this.captureTime - prevFrame.captureTime} ms`

		if (printState) {
			console.log(`\tID=${this.id}, active=${this.active}, completed=${when}, final state:`, this.state);
		} else {
			console.log(`\tID=${this.id}, active=${this.active}, completed=${when}`);
		}

		var actions = sortBy(this.actions, a => {
				const path = a.impl.dotPath();

				return path=="root" ?0 :path;
			});

		if (filter) {
			actions = actions.filter(filter);
		}

		if (actions.length == 0) {
			console.log(`\t\tNo actions ${ filter ?"using filter" :""}`)
		}

		for (let i=0, action; action=actions[i]; i++) {
			action.print(printState);
		}

		if (this.error) {
			const stack = this.error.stack ?this.error.stack :"n/a";

			console.log(`\t\tEnded in error: msg=${this.msg}, error=%O, stack=%O`, this.error, stack);
		}
	}
}

export class FrameAction {
	constructor(action, impl) {
		this.action = action;
		this.impl = impl;
	}

	print(printState=true) {
		const { action, impl } = this;

		if (printState) {
			console.log(`\t\t${impl.dotPath()}::${action.name}, replace=${!!action.replace} nextState=%O, startState=%O`,
					action.nextState, impl.state());
		} else {
			console.log(`\t\t${impl.dotPath()}::${action.name}, replace=${!!action.replace}`);
		}
	}
}


export function createConsoleLogger(logger) {
	return {
		get clear() {
			logger.clear();
		},

		get help() {
			console.log(HELP_MSG+logger.name+"\n\n");
		},

		get maxFrames() {
			logger.maxFrames;
		},

		get print() {
			logger.print();
		},

		get printNoState() {
			logger.print(false);
		},

		get store() {
			return logger.store;
		},

		clearTrap(name) {
			logger.clearTrap(name);
		},

		setActionFilter(filter) {
			logger.setActionFilter(filter);
		},

		setMaxFrames(maxFrames) {
			logger.setMaxFrames(maxFrames);
		},

		setTrap(condition, value, name) {
			return logger.setTrap(condition, value, name);
		},

		tail(count, printState) {
			logger.tail(count, printState);
		},

		get index() {
			return logger.index;
		},

		get size() {
			return logger.size;
		},

		get back() {
			return logger.back();
		},

		get forward() {
			return logger.forward();
		},

		goto(idx) {
			logger.goto(idx);
		},
	}
}


