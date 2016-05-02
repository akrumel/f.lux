"use strict";

exports.__esModule = true;
exports.FrameAction = exports.LogFrame = exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class;

exports.createConsoleLogger = createConsoleLogger;

var _autobindDecorator = require("autobind-decorator");

var _autobindDecorator2 = _interopRequireDefault(_autobindDecorator);

var _lodash = require("lodash.has");

var _lodash2 = _interopRequireDefault(_lodash);

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _lodash3 = require("lodash.sortby");

var _lodash4 = _interopRequireDefault(_lodash3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
	var desc = {};
	Object['ke' + 'ys'](descriptor).forEach(function (key) {
		desc[key] = descriptor[key];
	});
	desc.enumerable = !!desc.enumerable;
	desc.configurable = !!desc.configurable;

	if ('value' in desc || desc.initializer) {
		desc.writable = true;
	}

	desc = decorators.slice().reverse().reduce(function (desc, decorator) {
		return decorator(target, property, desc) || desc;
	}, desc);

	if (context && desc.initializer !== void 0) {
		desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
		desc.initializer = undefined;
	}

	if (desc.initializer === void 0) {
		Object['define' + 'Property'](target, property, desc);
		desc = null;
	}

	return desc;
}

/*
	Todo:
		- Time travel
		- realtime loggin flags: updates and actions (with path filters)
*/

var HELP_MSG = "f.lux logger commands:\n\tclear     - removes all logs\n\thelp      - f.lux logger commands\n\tmaxFrames - # of store updates to cache (default=50)\n\tprint     - print logs to console\n\tstore     - gets the f.lux store\n\nFunctions:\n\tsetMaxFrames(maxFrames) - set the maximum number of store states to maintain (default=50)\n\ttail(count=10)          - prints last 'count' store updates\n\n\nf.lux log available at window.";

var Logger = (_class = function () {
	function Logger(store) {
		var name = arguments.length <= 1 || arguments[1] === undefined ? "flog" : arguments[1];

		_classCallCheck(this, Logger);

		this.store = store;
		this.name = name;
		this.nextFrameId = 1;
		this.filter = null;
		this.frames = [];
		this.maxFrames = 50;

		this.activeFrame = new LogFrame(store, this.nextFrameId++);

		this.activeFrame.captureState();
		this.frames.push(this.activeFrame);

		this.currFrame = new LogFrame(store, this.nextFrameId++);

		window[name] = this.console = createConsoleLogger(this);
		this.console.help;
	}

	_createClass(Logger, [{
		key: "clear",
		value: function clear() {
			this.activeFrame = new LogFrame(store, this.nextFrameId++);
			this.activeFrame.captureState();

			this.frames = [this.activeFrame];
			this.currFrame = new LogFrame(store, this.nextFrameId++);
		}
	}, {
		key: "print",
		value: function print() {
			var frames = this.frames;

			console.log("f.lux log");

			for (var i = 0, frame; frame = frames[i]; i++) {
				frame.print(this.filter, frames[i - 1]);
			}

			if (this.currFrame.actions.length) {
				console.log("\nf.lux log current frame:");
				this.currFrame.print();
			}

			console.log("\n\n");
		}
	}, {
		key: "setActionFilter",
		value: function setActionFilter(filter) {
			if (filter instanceof RegExp) {
				this.filter = function (af) {
					return filter.test(af.impl.dotPath() + "::" + af.action.name);
				};
			} else {
				this.filter = filter;
			}
		}
	}, {
		key: "setMaxFrames",
		value: function setMaxFrames(maxFrames) {
			this.maxFrames = maxFrames;

			this.truncateFrames();
		}
	}, {
		key: "tail",
		value: function tail() {
			var count = arguments.length <= 0 || arguments[0] === undefined ? 10 : arguments[0];

			var frames = this.frames;
			var start = frames.length > count ? frames.length - count : 0;
			var prevFrame;

			console.log("f.lux tail - count=" + count);

			for (var i = start, frame; frame = this.frames[i]; i++) {
				frame.print(this.filter, prevFrame);
				prevFrame = frame;
			}
		}

		//******************************************************************************************************************
		//  Store listener methods
		//******************************************************************************************************************

	}, {
		key: "onError",
		value: function onError(store, msg, error) {
			// mark current active frame as not active
			this.activeFrame.active = false;

			this.currFrame.onError(msg, error);
			this.frames.push(this.currFrame);
			this.truncateFrames();

			this.activeFrame = this.currFrame;
			this.currFrame = new LogFrame(store, this.nextFrameId++);

			console.warn("Store error: msg=" + msg + ", error=" + error);
			error && error.stack && console.warn(error.stack);
		}
	}, {
		key: "onPostStateUpdate",
		value: function onPostStateUpdate(store, action, impl) {
			this.currFrame.addAction(action, impl);
		}
	}, {
		key: "onPostUpdate",
		value: function onPostUpdate(store, time, currState, prevState) {
			var activeIdx = this.frames.indexOf(this.activeFrame);

			// remove all frames after current active frame (time travel occured)
			if (activeIdx < this.frames.length - 1) {
				this.frames = this.frames.slice(0, activeIdx + 1);
			}

			// mark current active frame as not active
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

	}, {
		key: "truncateFrames",
		value: function truncateFrames() {
			if (this.maxFrames > 0 && this.maxFrames < this.frames.length) {
				this.frames = this.frames.slice(this.frames.length - this.maxFrames);
			}
		}

		//******************************************************************************************************************
		//  time travel
		//******************************************************************************************************************

	}, {
		key: "back",
		value: function back() {
			if (this.index === 0) {
				return;
			}

			this.goto(this.index - 1);
		}
	}, {
		key: "forward",
		value: function forward() {
			if (this.index + 1 === this.size) {
				return;
			}

			this.goto(this.index + 1);
		}
	}, {
		key: "goto",
		value: function goto(idx) {
			if (idx === this.idx) {
				return;
			} else if (idx < 0 || idx >= this.size) {
				console.log("Time travel error - invalid index: " + idx);
			}

			var currActiveFrame = this.activeFrame;
			var nextActiveFrame = this.frames[idx];
			var store = this.store;
			/*
   	Questions:
   		will this fire any listener methods and mess things up?
   */
			store.changeState(nextActiveFrame.state, true, nextActiveFrame.time);

			currActiveFrame.active = false;
			nextActiveFrame.active = true;

			this.activeFrame = nextActiveFrame;
		}
	}, {
		key: "index",
		get: function get() {
			return this.frames.indexOf(this.activeFrame);
		}
	}, {
		key: "size",
		get: function get() {
			return this.frames.length;
		}
	}]);

	return Logger;
}(), (_applyDecoratedDescriptor(_class.prototype, "onError", [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, "onError"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "onPostStateUpdate", [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, "onPostStateUpdate"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "onPostUpdate", [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, "onPostUpdate"), _class.prototype)), _class);
exports.default = Logger;

var LogFrame = exports.LogFrame = function () {
	function LogFrame(store, id) {
		_classCallCheck(this, LogFrame);

		this.id = id;
		this.store = store;
		this.actions = [];
		this.active = false;
	}

	_createClass(LogFrame, [{
		key: "activate",
		value: function activate() {
			(0, _invariant2.default)((0, _lodash2.default)(this, state), "LogFrame does not have a state");

			this.store.changeState(this.state, true);
			this.active = true;
		}
	}, {
		key: "addAction",
		value: function addAction(action, impl) {
			this.actions.push(new FrameAction(action, impl));
		}
	}, {
		key: "captureState",
		value: function captureState() {
			this.state = this.store.state;
			this.active = true;
			this.time = this.store.updateTime;
			this.captureTime = new Date();
		}
	}, {
		key: "completed",
		value: function completed(time, currState) {
			this.time = time;
			this.state = currState;
			this.active = true;
			this.captureTime = new Date();
		}
	}, {
		key: "inactivate",
		value: function inactivate() {
			this.active = false;
		}
	}, {
		key: "onError",
		value: function onError(msg, error) {
			this.state = this.store.state;
			this.active = true;
			this.msg = msg;
			this.error = error;
			this.captureTime = new Date();
		}
	}, {
		key: "print",
		value: function print() {
			var filter = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
			var prevFrame = arguments[1];

			var when = !this.captureTime ? "n/a" : !prevFrame ? this.captureTime.toLocaleString() : "+" + (this.captureTime - prevFrame.captureTime) + " ms";

			console.log("\tID=" + this.id + ", active=" + this.active + ", completed=" + when + ", final state:", this.state);

			var actions = (0, _lodash4.default)(this.actions, function (a) {
				var path = a.impl.dotPath();

				return path == "root" ? 0 : path;
			});

			if (filter) {
				actions = actions.filter(filter);
			}

			if (actions.length == 0) {
				console.log("\t\tNo actions " + (filter ? "using filter" : ""));
			}

			for (var i = 0, action; action = actions[i]; i++) {
				action.print();
			}

			if (this.error) {
				var stack = this.error.stack ? this.error.stack : "n/a";

				console.log("\t\tEnded in error: msg=" + this.msg + ", error=%O, stack=%O", this.error, stack);
			}
		}
	}]);

	return LogFrame;
}();

var FrameAction = exports.FrameAction = function () {
	function FrameAction(action, impl) {
		_classCallCheck(this, FrameAction);

		this.action = action;
		this.impl = impl;
	}

	_createClass(FrameAction, [{
		key: "print",
		value: function print() {
			var action = this.action;
			var impl = this.impl;


			console.log("\t\t" + impl.dotPath() + "::" + action.name + ", replace=" + !!action.replace + " nextState=%O, startState=%O", action.nextState, impl.state);
		}
	}]);

	return FrameAction;
}();

function createConsoleLogger(logger) {
	return {
		get clear() {
			logger.clear();
		},

		get help() {
			console.log(HELP_MSG + this.name + "\n\n");
		},

		get maxFrames() {
			logger.maxFrames;
		},

		get print() {
			logger.print();
		},

		get store() {
			return logger.store;
		},

		setActionFilter: function setActionFilter(filter) {
			logger.setActionFilter(filter);
		},
		setMaxFrames: function setMaxFrames(maxFrames) {
			logger.setMaxFrames(maxFrames);
		},
		tail: function tail(count) {
			logger.tail(count);
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

		goto: function goto(idx) {
			logger.goto(idx);
		}
	};
}