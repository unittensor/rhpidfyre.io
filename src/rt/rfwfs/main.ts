import { type EntryCollection } from "./collection"

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

interface Entry<T extends Entry<T>> {
	readonly name: string,
	readonly type: EntryType,
	readonly inner: T,
	readonly timestamp: number,
	readonly collection?: EntryCollection<T>,
	readonly permissions: Permissions,
}
interface Rfwfs {
	new_entry: <T extends Entry<T>>(name: string, permissions: Permissions, timestamp: number, inner: T) => Entry<T>,
	entry_trait: <T extends Entry<T>>(inner: T) => EntryCollection<T>
	new_entry_tree: <T>(files: T) => T,
}

const rfwfs = {} as Rfwfs

rfwfs.new_entry = function(name, permissions, timestamp, inner) {
	const file_type = typeof inner == "object" ? EntryType.Directory : EntryType.File
	return {
		name: name,
		type: file_type,
		inner: inner,
		timestamp: timestamp ? timestamp : Math.floor(Date.now()/1000),
		collection: file_type === EntryType.Directory ? this.entry_trait(inner) : undefined,
		permissions: permissions,
	}
}

export {
	EntryType,
	Permissions,
	type EntryCollection,
	type Entry,
}