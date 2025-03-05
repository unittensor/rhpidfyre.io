import { type Entry } from "./main"

import entry_search from "./index"

type Files<T> = Entry<T>[]

interface EntryCollectionManipulate<T extends Entry<T>> {
	pop: (file_name: string) => Entry<T> | undefined,
	get: (file_name: string) => Entry<T> | undefined
	push: (entry: Entry<T>) => boolean,
	sort: () => void,
}
interface EntryCollection<T extends Entry<T>> extends EntryCollectionManipulate<T> {
	readonly inner: Files<T>
}

function sort<E extends Entry<E>>(self: EntryCollection<E>) {
	self.inner.sort((a,z) => a.name.localeCompare(z.name))
}

function push<E extends Entry<E>>(self: EntryCollection<E>, entry: Entry<E>) {
	const no_duplicates = entry_search(self.inner, entry.name)
	if (!no_duplicates) {
		self.push(entry)
		self.sort()
		return true
	}
	return false
}

function get<E extends Entry<E>>(self: EntryCollection<E>, file_name: string) {
	const file_search = entry_search(self.inner, file_name)
	return file_search ? file_search.result : undefined
}

function pop<E extends Entry<E>>(self: EntryCollection<E>, file_name: string) {
	const file_search = entry_search(self.inner, file_name)
	if (file_search) {
		self.inner.splice(file_search.index, 1)
		return file_search.result
	}
	return undefined
}

function entry_collection<E extends Entry<E>>(inner: Files<E>): EntryCollection<E> {
	const collection = { inner: inner } as EntryCollection<E>
	collection.sort = function()          { return sort(this) }
	collection.push = function(entry)     { return push(this, entry) }
	collection.get  = function(file_name) { return get(this, file_name) }
	collection.pop  = function(file_name) { return pop(this, file_name) }
	return collection
}

export {
	entry_collection,
	type EntryCollection,
	type Files,
}