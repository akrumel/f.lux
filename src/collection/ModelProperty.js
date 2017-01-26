
import ObjectProperty from "../ObjectProperty";
import PrimitiveProperty from "../PrimitiveProperty";
import shadow from "../decorators/shadow";
import shadowBound from "../decorators/shadowBound";
import StateType from "../StateType";

import ModelAccess from "./ModelAccess";


/*
	Todo:
		* define shadow class and remove decorators
*/

export default class ModelProperty extends ObjectProperty {
	constructor(stateType=ModelProperty.type) {
		super(stateType);
	}

	/*
		Used by CollectionProperty to obtain the a model definition suitable for creating a
		ModelProperty instance.
	*/
	static modelDefinitionFor(state, collection) {
		const id = collection.extractId(state);
		const cid = id || collection.makeId();

		return {
			id: id || cid,
			cid: cid,
			data: state,
			dirty: false,
			lastReqId: -1,
			waiting: false,
		}
	}

	get cid() {
		return this._() && this._().cid;
	}

	get collection() {
		return this.parent().parent();
	}

	get data() {
		return this._() && this._().data;
	}

	/*
		Gets the ID by which the collection is tracking the model. This will be the persistent storage
		ID or an ID created by the collection
	*/
	get id() {
		return this._() && this._().id;
	}

	@shadow
	changeId(id) {
		if (this._() && this._().id !== id) {
			this._().id = id;
		}
	}

	clearCheckpoint() {
		const { collection, data } = this;
		const dataProp = data && data.$$();

		if (collection.isAutocheckpoint() && dataProp) {
			dataProp.clearCheckpoint();
		}
	}

	clearDirty() {
		if (this._()) {
			this._().dirty = false;
		}

		this.clearCheckpoint();
	}

	resetDataToCheckpoint() {
		const dataProp = this.data && this.data.$$();

		dataProp && dataProp.resetToCheckpoint();

		if (this._()) {
			this._().dirty = false;
		}
	}

	@shadowBound
	defaults(data) {
		const id = this.collection.extractId(data);
		const state = this._();
		const currDirty = state.$().nextState().dirty;

		// update the ID if it has changed
		if (this._().id !== id) {
			this._().id = id;
		}

		this._().data.__().defaults(data);

		// reset to not dirty if was not dirty before the merge since assuming data being merged
		// is coming from a source of truth, such as data returned from a save
		if (!currDirty) {
			this.clearDirty();
		}
	}

	@shadowBound
	destroy() {
		return this.collection.destroy(this.cid);
	}

	@shadowBound
	isWaiting() {
		return this._() && this._().waiting;
	}

	isDirty() {
		return this._() && this._().dirty;
	}

	/*
		Gets if this model has not yet been saved to persistent storage. Assignment of an ID property
		is used to determine if an object has been saved.
	*/
	@shadowBound
	isNew() {
		const id = this.collection.extractId(this.data);

		return !id;
	}

	@shadowBound
	merge(data) {
		const id = this.collection.extractId(data);
		const state = this._();
		const currDirty = state.$().nextState().dirty;

		// update the ID if it has changed
		if (state.id !== id) {
			state.id = id;
		}

		state.data.__().merge(data);

		// reset to not dirty if was not dirty before the merge since assuming data being merged
		// is coming from a source of truth, such as data returned from a save
		if (!currDirty) {
			this.clearDirty();
		}
	}

	@shadowBound
	save() {
		return this.collection.save(this.cid);
	}

	setBusy(busy) {
		if (busy === this[_busy]) { return }

		this[_busy] = busy;
		this.touch();
	}

	@shadowBound
	setData(data) {
		const id = this.collection.extractId(state);
		const state = this._();

		// set state first since we trap the invalidate() call and set the dirty flag
		state.data = data;

		// now we can explicitly set the dirty flag
		this.clearDirty();

		// update the id if it has changed
		if (state.id !== id) {
			state.id = id;
		}
	}

	//------------------------------------------------------------------------------------------------------
	// Property subclasses may want to override success methods
	//------------------------------------------------------------------------------------------------------

	/*
		Creates a ModelAccess for this property's implementations. ModelAccess will generate a ShadowModelAccess
		for its 'data' child which will in turn generate a ShadowModelAccess for each of its children.
	*/
	create$(impl) {
		return new ModelAccess(impl, this);
	}

	propertyChildInvalidated(childProperty) {
		if (childProperty.__().name() == "data" && !this._().dirty) {
			this._().dirty = true;

			if (this.collection.isAutocheckpoint && !childProperty.hasCheckpoint()) {
				childProperty.checkpoint();
			}
		}
	}
}


StateType.defineType(ModelProperty, spec => {
		spec.initialState({})
			.readonlyOff
			.typeName("ModelProperty")
	});

