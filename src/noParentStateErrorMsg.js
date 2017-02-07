
/** @ignore */
export default function noParentStateErrorMsg(name, parentImpl) {
	const path = parentImpl ?parentImpl.dotPath() :"undefined";

	return `No parent state for non-root shadow property: name=${name}, parent=${path}`;
}
