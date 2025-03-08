import { EntryType, PushStatus, ReadStatus, Permissions } from "./enum"
import { wrap_entry, wrap_none, WrapResultEntry, WrapResultNone } from "./wrap"

import directory_search from "./index"

type FileInner = string | number

interface Entry {
	name: string,
	timestamp: number,
	permissions: Permissions,
	//please do not change the inner values directly on entries or else there will be catastrophic consequences
	readonly type: EntryType,
}
interface EntryFileInner {
	__body: FileInner,
	write: (item: FileInner) => boolean,
	read: () => FileInner | undefined,
}
interface EntryFile extends Entry {
	inner: EntryFileInner,
	hash: string,
}
interface EntryCollection<T extends Entry> extends Entry {
	inner: EntryCollectionManipulate<T>,
}
interface EntryCollectionManipulate<T extends Entry> {
	__body: T[],
	clone: (file_name: string) => WrapResultEntry<T, ReadStatus>
	find: (file_name: string) => WrapResultEntry<T, ReadStatus>
	push: (entry: Entry) => WrapResultNone<PushStatus>,
	sort: () => void,
	pop: (file_name: string) => WrapResultEntry<T, ReadStatus>,
}

interface Rfwfs {
	directory: <T extends Entry>(default_name: string, permissions: Permissions, timestamp: number, inner_default?: T[]) => EntryCollection<T>,
	is_file: <T extends Entry>(entry: T) => boolean,
	is_dir: <T extends Entry>(entry: T) => boolean,
	file: (default_name: string, permissions: Permissions, timestamp: number, inner_default?: FileInner) => EntryFile,
}

function read_write_access(permissions: Permissions): boolean {
	return permissions === Permissions.rw
}
function read_access(permissions: Permissions): boolean {
	return read_write_access(permissions) || permissions === Permissions.r
}
function write_access(permissions: Permissions): boolean {
	return read_write_access(permissions) || permissions === Permissions.w
}

function directory_sort<E extends Entry>(self: EntryCollectionManipulate<E>) {
	self.__body.sort((a,z) => a.name.localeCompare(z.name))
}

function directory_push<E extends Entry>(self: EntryCollection<E>, entry: E): WrapResultNone<PushStatus> {
	if (write_access(self.permissions)) {
		const no_duplicates = directory_search(self.inner.__body, entry.name)
		if (!no_duplicates) {
			self.inner.__body.push(entry)
			self.inner.__body.sort()
			return wrap_none(PushStatus.Ok)
		}
		return wrap_none(PushStatus.Duplicate)
	}
	return wrap_none(PushStatus.Denied)
}

function directory_find<E extends Entry>(self: EntryCollection<E>, file_name: string): WrapResultEntry<E, ReadStatus> {
	if (read_access(self.permissions)) {
		const file_search = directory_search(self.inner.__body, file_name)
		if (file_search) {
			return wrap_entry(ReadStatus.Ok, file_search.result)
		}
		return wrap_entry(ReadStatus.NotFound)
	}
	return wrap_entry(ReadStatus.Denied)
}

function directory_pop<E extends Entry>(self: EntryCollection<E>, file_name: string): WrapResultEntry<E, ReadStatus> {
	if (read_write_access(self.permissions)) {
		const pop_find = directory_search(self.inner.__body, file_name)
		if (pop_find) {
			self.inner.__body.splice(pop_find.some, 1)
			return wrap_entry(ReadStatus.Ok, pop_find.result)
		}
		return wrap_entry(ReadStatus.NotFound)
	}
	return wrap_entry(ReadStatus.Denied)
}

function directory_clone<E extends Entry>(self: EntryCollection<E>, file_name: string): WrapResultEntry<E, ReadStatus> {
	if (read_write_access(self.permissions)) {
		const clone_find = directory_search(self.inner.__body, file_name)
		if (clone_find) {
			return wrap_entry(ReadStatus.Ok, { ...clone_find.result })
		}
		return wrap_entry(ReadStatus.NotFound)
	}
	return wrap_entry(ReadStatus.Denied)
}

function file_inner_read(self: EntryFileInner, permissions: Permissions): FileInner | undefined {
	return read_access(permissions) ? self.__body : undefined
}

function file_inner_write(self: EntryFileInner, permissions: Permissions, item: FileInner): boolean {
	if (write_access(permissions)) {
		self.__body = item
		return true
	}
	return false
}

function file_inner(permissions: Permissions, inner_default: FileInner): EntryFileInner {
	const file_inner_trait = { __body: inner_default } as EntryFileInner
	file_inner_trait.read  = function()     { return file_inner_read(this, permissions) }
	file_inner_trait.write = function(item) { return file_inner_write(this, permissions, item) }
	return file_inner_trait
}

function dir_inner<T extends Entry>(self: EntryCollection<T>, collection: T[]): EntryCollectionManipulate<T> {
	const collection_trait = { __body: collection } as EntryCollectionManipulate<T>
	collection_trait.clone = function(file_name) { return directory_clone(self, file_name) }
	collection_trait.pop   = function(file_name) { return directory_pop(self, file_name) }
	collection_trait.find  = function(file_name) { return directory_find(self, file_name) }
	collection_trait.push  = function(entry)     { return directory_push(self, entry) }
	collection_trait.sort  = function()          { return directory_sort(this) }
	collection_trait.sort() //the default collection is automatically sorted on directory creation.
	return collection_trait
}

const rfwfs = {} as Rfwfs

rfwfs.is_dir = function(entry) {
	return entry.type === EntryType.Directory
}
rfwfs.is_file = function(entry) {
	return entry.type === EntryType.File
}

rfwfs.file = function(default_name, permissions, timestamp, inner_default) {
	const file = { type: EntryType.File } as EntryFile
	file.permissions = permissions
	file.timestamp = timestamp
	file.inner = file_inner(permissions, inner_default ? inner_default : "")
	file.name = default_name
	file.hash = "0"
	return file
}

rfwfs.directory = function<T extends Entry>(default_name: string, permissions: Permissions, timestamp: number, inner_default?: T[]): EntryCollection<T> {
	const directory = { type: EntryType.Directory } as EntryCollection<T>
	directory.permissions = permissions
	directory.timestamp = timestamp
	directory.inner = dir_inner(directory, inner_default ? inner_default : [])
	directory.name = default_name
	return directory
}

export default rfwfs
export {
	type FileInner,
	type Entry,
	type EntryFile,
	type EntryFileInner,
	type EntryCollection,
	type EntryCollectionManipulate,
}