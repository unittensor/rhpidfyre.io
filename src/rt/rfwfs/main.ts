import entry_search from "./index"

const enum EntryType {
	Directory,
	File
}
const enum Permissions {
	r,
	w,
	rw,
	none
}

interface Entry {
	readonly name: string,
	readonly type: EntryType,
	readonly timestamp: number,
	readonly permissions: Permissions,
}
interface EntryCollectionInner<T extends Entry> extends Entry {
	readonly collection: T[],
}
interface EntryFile<T> extends Entry {
	inner: T
}

interface EntryCollection<T extends Entry> extends EntryCollectionInner<T> {
	pop: (file_name: string) => T | undefined,
	find: (file_name: string) => T | undefined
	push: <E extends Entry>(entry: E) => boolean,
	sort: () => void,
}
interface Rfwfs {
	is_dir: <T extends Entry>(entry: T) => boolean,
	is_file: <T extends Entry>(entry: T) => boolean,
	new_entry: <T>(name: string, permissions: Permissions, timestamp: number, inner: T) => EntryFile<T>,
	new_collection: <T extends Entry>(inner: T[]) => EntryCollection<T>,
}

function sort<E extends Entry>(self: EntryCollection<E>) {
	self.collection.sort((a,z) => a.name.localeCompare(z.name))
}

function push<E extends Entry>(self: EntryCollection<E>, entry: Entry) {
	const no_duplicates = entry_search(self.collection, entry.name)
	if (!no_duplicates) {
		self.push(entry)
		self.sort()
		return true
	}
	return false
}

function find<E extends Entry>(self: EntryCollection<E>, file_name: string) {
	const file_search = entry_search(self.collection, file_name)
	return file_search ? file_search.result : undefined
}

function pop<E extends Entry>(self: EntryCollection<E>, file_name: string) {
	const file_search = entry_search(self.collection, file_name)
	if (file_search) {
		self.collection.splice(file_search.index, 1)
		return file_search.result
	}
	return undefined
}

const rfwfs = {} as Rfwfs

rfwfs.is_dir = function(entry) {
	return entry.type === EntryType.Directory
}

rfwfs.is_file = function(entry) {
	return entry.type === EntryType.File
}

rfwfs.new_entry = function(name, permissions, timestamp, inner) {
	return {
		name: name,
		type: typeof inner === "object" ? EntryType.Directory : EntryType.File,
		inner: inner,
		timestamp: timestamp ? timestamp : (Date.now()/1000)|0,
		permissions: permissions,
	}
}

rfwfs.new_collection = function<T extends Entry>(collection: T[]): EntryCollection<T> {
	const collection_trait = { collection: collection } as EntryCollection<T>
	collection_trait.sort = function()          { return sort(this) }
	collection_trait.push = function(entry)     { return push(this, entry) }
	collection_trait.pop  = function(file_name) { return pop(this, file_name) }
	collection_trait.find  = function(file_name) { return find(this, file_name) }
	return collection_trait
}

export default rfwfs
export {
	EntryType,
	Permissions,
	type EntryCollection,
	type Entry,
}