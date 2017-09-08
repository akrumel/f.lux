

/**
	Base class for property offline-first data. A single instance is registered with a {@link Store}
	and utilized by all properties supporting offline-first behavior.

	The `Store` does not enforcce instance to subclass this class and its purpose is meant to
	define the expected API.
*/
export default class OfflineDataStore {
	clear() {
		throw new Error("Subclasses must implement clear()");
	}

	deleteBackups(storageKey, prop) {
		throw new Error("Subclasses must implement deleteBackups()");
	}

	getOfflineData(storageKey, dataKey, prop) {
		throw new Error("Subclasses must implement getOfflineData()");
	}

	setOfflineData(storageKey, dataKey, state, prop) {
		throw new Error("Subclasses must implement setOfflineData()");
	}
}