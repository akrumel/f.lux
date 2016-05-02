
export default /* doneIterator */ {
	done: true,
	[Symbol.iterator]() { return { done: true } }
}
