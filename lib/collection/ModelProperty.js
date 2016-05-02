"use strict";

exports.__esModule = true;
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class;

var _KeyedProperty2 = require("../KeyedProperty");

var _KeyedProperty3 = _interopRequireDefault(_KeyedProperty2);

var _PrimitiveProperty = require("../PrimitiveProperty");

var _PrimitiveProperty2 = _interopRequireDefault(_PrimitiveProperty);

var _shadow = require("../decorators/shadow");

var _shadow2 = _interopRequireDefault(_shadow);

var _shadowBound = require("../decorators/shadowBound");

var _shadowBound2 = _interopRequireDefault(_shadowBound);

var _ModelAccess = require("./ModelAccess");

var _ModelAccess2 = _interopRequireDefault(_ModelAccess);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

var ModelProperty = (_class = function (_KeyedProperty) {
	_inherits(ModelProperty, _KeyedProperty);

	function ModelProperty(modelDefn) {
		var autoShadow = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
		var readonly = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

		_classCallCheck(this, ModelProperty);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(ModelProperty).call(this, modelDefn, true));
	}

	/*
 	Used by CollectionProperty to obtain the a model definition suitable for creating a
 	ModelProperty instance.
 */


	_createClass(ModelProperty, [{
		key: "changeId",
		value: function changeId(id) {
			if (this._.id !== id) {
				this._.id = id;
			}
		}
	}, {
		key: "defaults",
		value: function defaults(data) {
			var id = this.collection.extractId(data);
			var state = this._;
			var currDirty = state.$.nextState().dirty;

			// update the ID if it has changed
			if (this._.id !== id) {
				this._.id = id;
			}

			this._.data.__.defaults(data);

			// reset to not dirty if was not dirty before the merge since assuming data being merged
			// is coming from a source of truth, such as data returned from a save
			if (!currDirty) {
				this._.dirty = false;
			}
		}
	}, {
		key: "destroy",
		value: function destroy() {
			return this.collection.destroy(this.cid);
		}

		/*
  	Gets if this model has not yet been saved to persistent storage. Assignment of an ID property
  	is used to determine if an object has been saved.
  */

	}, {
		key: "isNew",
		value: function isNew() {
			var id = this.collection.extractId(this.data);

			return !id;
		}
	}, {
		key: "merge",
		value: function merge(data) {
			var id = this.collection.extractId(data);
			var state = this._;
			var currDirty = state.$.nextState().dirty;

			// update the ID if it has changed
			if (this._.id !== id) {
				this._.id = id;
			}

			this._.data.__.merge(data);

			// reset to not dirty if was not dirty before the merge since assuming data being merged
			// is coming from a source of truth, such as data returned from a save
			if (!currDirty) {
				this._.dirty = false;
			}
		}
	}, {
		key: "save",
		value: function save() {
			this.collection.save(this.cid);
		}
	}, {
		key: "setData",
		value: function setData(data) {
			var id = this.collection.extractId(state);
			var state = this._;

			// set state first since we trap the invalidate() call and set the dirty flag
			state.data = data;

			// now we can explicitly set the dirty flag
			state.dirty = false;

			// update the id if it has changed
			if (state.id !== id) {
				state.id = id;
			}
		}

		//------------------------------------------------------------------------------------------------------
		// Property subclasses may want to override thise methods
		//------------------------------------------------------------------------------------------------------

		/*
  	Creates a ModelAccess for this property's implementations. ModelAccess will generate a ShadowModelAccess
  	for its 'data' child which will in turn generate a ShadowModelAccess for each of its children.
  */

	}, {
		key: "create$",
		value: function create$(impl) {
			return new _ModelAccess2.default(impl, this);
		}
	}, {
		key: "onChildInvalidated",
		value: function onChildInvalidated(childProperty) {
			if (childProperty.__.name == "data" && !this._.dirty) {
				this._.dirty = true;
			}
		}
	}, {
		key: "cid",
		get: function get() {
			return this._.cid;
		}
	}, {
		key: "collection",
		get: function get() {
			return this.parent.parent;
		}
	}, {
		key: "data",
		get: function get() {
			return this._.data;
		}
	}, {
		key: "dirty",
		get: function get() {
			return this._.dirty;
		}

		/*
  	Gets the ID by which the collection is tracking the model. This will be the persistent storage
  	ID or an ID created by the collection
  */

	}, {
		key: "id",
		get: function get() {
			return this._.id;
		}
	}], [{
		key: "modelDefinitionFor",
		value: function modelDefinitionFor(state, collection) {
			var id = collection.extractId(state);
			var cid = id || collection.makeId();

			return {
				id: id || cid,
				cid: cid,
				data: state,
				dirty: false
			};
		}
	}]);

	return ModelProperty;
}(_KeyedProperty3.default), (_applyDecoratedDescriptor(_class.prototype, "changeId", [_shadow2.default], Object.getOwnPropertyDescriptor(_class.prototype, "changeId"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "defaults", [_shadowBound2.default], Object.getOwnPropertyDescriptor(_class.prototype, "defaults"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "destroy", [_shadowBound2.default], Object.getOwnPropertyDescriptor(_class.prototype, "destroy"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "isNew", [_shadowBound2.default], Object.getOwnPropertyDescriptor(_class.prototype, "isNew"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "merge", [_shadowBound2.default], Object.getOwnPropertyDescriptor(_class.prototype, "merge"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "save", [_shadowBound2.default], Object.getOwnPropertyDescriptor(_class.prototype, "save"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "setData", [_shadowBound2.default], Object.getOwnPropertyDescriptor(_class.prototype, "setData"), _class.prototype)), _class);
exports.default = ModelProperty;