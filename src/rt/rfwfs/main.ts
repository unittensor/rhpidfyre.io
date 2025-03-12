import { EntryType, PushStatus, ReadStatus, Permissions, ConstEnum, PermissionsBinary } from "./enum"
import { wrap_entry, wrap_none, WrapResultEntry, WrapResultNone } from "./wrap"

import directory_search from "./index"
import hash_table from "./hash"

type FileInner = string | number
type EntryFileInner = EntryValue<FileInner, FileInner | undefined>

//please do not change the inner values directly on entries or else there will be catastrophic consequences
interface EntryValue<T, U = T> {
	__inner: T,
	write: (value: T) => boolean,
	read: () => U,
}
interface Entry {
	permissions: Permissions,
	timestamp: EntryValue<number>,
	name: EntryValue<string>,
	readonly type: EntryType,
}
interface EntryFile extends Entry {
	inner: EntryFileInner,
	hash: string,
}
interface EntryCollection<T extends Entry> extends Entry {
	inner: EntryCollectionManipulate<T>,
}
interface EntryCollectionManipulate<T extends Entry> {
	__inner: T[],
	clone: (file_name: string) => WrapResultEntry<T, ReadStatus>
	find: (file_name: string) => WrapResultEntry<T, ReadStatus>
	push: (entry: Entry) => WrapResultNone<PushStatus>,
	sort: () => void,
	pop: (file_name: string) => WrapResultEntry<T, ReadStatus>,
}
interface Rfwfs {
	directory: <T extends Entry>(default_name: string, default_permissions: Permissions, default_timestamp?: number, default_inner?: T[]) => EntryCollection<T>,
	file: (default_name: string, default_permissions: Permissions, default_timestamp?: number, default_inner?: FileInner) => Promise<EntryFile>,
	is_binary: <T extends Entry>(entry: T) => boolean,
	is_file: <T extends Entry>(entry: T) => boolean,
	is_dir: <T extends Entry>(entry: T) => boolean,
}

function execute_access<P extends ConstEnum>(permissions: P): boolean {
	return permissions === PermissionsBinary.rwx
		|| permissions === PermissionsBinary.rx
		|| permissions === PermissionsBinary.wx
		|| permissions === PermissionsBinary.x
}
function read_write_access<P extends ConstEnum>(permissions: P): boolean {
	return permissions === Permissions.rw
}
function read_access<P extends ConstEnum>(permissions: P): boolean {
	return read_write_access(permissions) || permissions === Permissions.r
}
function write_access<P extends ConstEnum>(permissions: P): boolean {
	return read_write_access(permissions) || permissions === Permissions.w
}

function directory_sort<E extends Entry>(self: EntryCollectionManipulate<E>) {
	self.__inner.sort((a,z) => a.name.read().localeCompare(z.name.read()))
}

function directory_push<E extends Entry>(self: EntryCollection<E>, entry: E): WrapResultNone<PushStatus> {
	if (read_write_access(self.permissions)) {
		const no_duplicates = directory_search(self.inner.__inner, entry.name.read())
		if (!no_duplicates) {
			self.inner.__inner.push(entry)
			self.inner.__inner.sort()
			return wrap_none(PushStatus.Ok)
		}
		return wrap_none(PushStatus.Duplicate)
	}
	return wrap_none(PushStatus.Denied)
}

function directory_find<E extends Entry>(self: EntryCollection<E>, file_name: string): WrapResultEntry<E, ReadStatus> {
	if (read_write_access(self.permissions)) {
		const file_search = directory_search(self.inner.__inner, file_name)
		if (file_search) {
			return wrap_entry(ReadStatus.Ok, file_search.result)
		}
		return wrap_entry(ReadStatus.NotFound)
	}
	return wrap_entry(ReadStatus.Denied)
}

function directory_pop<E extends Entry>(self: EntryCollection<E>, file_name: string): WrapResultEntry<E, ReadStatus> {
	if (read_write_access(self.permissions)) {
		const pop_find = directory_search(self.inner.__inner, file_name)
		if (pop_find) {
			self.inner.__inner.splice(pop_find.some, 1)
			return wrap_entry(ReadStatus.Ok, pop_find.result)
		}
		return wrap_entry(ReadStatus.NotFound)
	}
	return wrap_entry(ReadStatus.Denied)
}

function directory_clone<E extends Entry>(self: EntryCollection<E>, file_name: string): WrapResultEntry<E, ReadStatus> {
	if (read_write_access(self.permissions)) {
		const clone_find = directory_search(self.inner.__inner, file_name)
		if (clone_find) {
			return wrap_entry(ReadStatus.Ok, { ...clone_find.result })
		}
		return wrap_entry(ReadStatus.NotFound)
	}
	return wrap_entry(ReadStatus.Denied)
}

function inner_read<I extends FileInner, P extends ConstEnum>(self: EntryValue<I>, permissions: P): FileInner | undefined {
	return read_access(permissions) ? self.__inner : undefined
}

function inner_write<I extends FileInner, P extends ConstEnum>(self: EntryValue<I>, permissions: P, item: I): boolean {
	if (write_access(permissions)) {
		self.__inner = item
		return true
	}
	return false
}

function inner<P extends ConstEnum, I, R extends EntryValue<I>>(permissions: P, inner_default: I): R {
	const inner_trait = { __inner: inner_default } as R
	inner_trait.write = function(item) { return inner_write(this, permissions, item) }
	inner_trait.read  = function()     { return inner_read(this, permissions) }
	return inner_trait
}

function dir_inner<T extends Entry>(self: EntryCollection<T>, collection: T[]): EntryCollectionManipulate<T> {
	const collection_trait = { __inner: collection } as EntryCollectionManipulate<T>
	collection_trait.clone = function(file_name) { return directory_clone(self, file_name) }
	collection_trait.find  = function(file_name) { return directory_find(self, file_name) }
	collection_trait.push  = function(entry)     { return directory_push(self, entry) }
	collection_trait.sort  = function()          { return directory_sort(this) }
	collection_trait.pop   = function(file_name) { return directory_pop(self, file_name) }
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
rfwfs.is_binary = function(entry) {
	return entry.type === EntryType.Binary
}

rfwfs.file = async function(default_name, default_permissions, default_timestamp, default_inner = "") {
	const file = { type: EntryType.File } as EntryFile
	file.permissions = default_permissions
	file.timestamp = inner(default_permissions, default_timestamp ? default_timestamp : (Date.now()/1000)|0)
	file.inner = inner(default_permissions, default_inner)
	file.name = inner(default_permissions, default_name)
	file.hash = await hash_table.sha256(default_inner)
	return file
}

rfwfs.directory = function<T extends Entry>(default_name: string, default_permissions: Permissions, default_timestamp?: number, default_inner?: T[]): EntryCollection<T> {
	const directory = { type: EntryType.Directory } as EntryCollection<T>
	directory.permissions = default_permissions
	directory.timestamp = inner(default_permissions, default_timestamp ? default_timestamp : (Date.now()/1000)|0)
	directory.inner = inner(default_permissions, default_inner)
	directory.name = inner(default_permissions, default_name)
	return directory
}

export default rfwfs
export {
	type EntryCollectionManipulate,
	type EntryCollection,
	type FileInner,
	type EntryFile,
	type Entry,
}