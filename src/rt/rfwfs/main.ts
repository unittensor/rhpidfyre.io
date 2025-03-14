import { EntryType, PushStatus, ReadStatus, Permissions, ConstEnum, PermissionsBinary } from "./enum"
import { wrap_entry, wrap_none, WrapResultEntry, WrapResultNone } from "./wrap"

import directory_search from "./index"
import hash_table from "./hash"

type FileInner = string | number
type EntryFileInner = EntryValue<FileInner, FileInner | undefined>

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

class Inner<T> {
	private inner: T;

	constructor(inner_default: T) {
		this.inner = inner_default
	}

	public write<P extends ConstEnum, I extends T>(dyn_permissions: P, item: I): boolean {
		if (write_access(dyn_permissions)) {
			this.inner = item
			return true
		}
		return false
	}

	public read<P extends ConstEnum>(dyn_permissions: P): T | undefined {
		return read_access(dyn_permissions) ? this.inner : undefined
	}
}

class RfwfsDirectory<T extends Entry> {
	private inner: T[];

	constructor(inner: T[]) {
		this.inner = inner
	}

	public sort() {
		this.inner.sort((a,z) => a.name.read().localeCompare(z.name.read()))
	}

	public clone<P extends ConstEnum>(dyn_permissions: P, file_name: string): WrapResultEntry<T, ReadStatus> {
		if (read_write_access(dyn_permissions)) {
			const clone_find = directory_search(this.inner, file_name)
			if (clone_find) {
				return wrap_entry(ReadStatus.Ok, { ...clone_find.result })
			}
			return wrap_entry(ReadStatus.NotFound)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public find<P extends ConstEnum>(dyn_permissions: P, file_name: string): WrapResultEntry<T, ReadStatus> {
		if (read_write_access(dyn_permissions)) {
			const file_search = directory_search(this.inner, file_name)
			if (file_search) {
				return wrap_entry(ReadStatus.Ok, file_search.result)
			}
			return wrap_entry(ReadStatus.NotFound)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push<P extends ConstEnum, E extends T>(dyn_permissions: P, entry: E): WrapResultNone<PushStatus> {
		if (read_write_access(dyn_permissions)) {
			const no_duplicates = directory_search(this.inner, entry.name.read())
			if (!no_duplicates) {
				this.inner.push(entry)
				this.inner.sort()
				return wrap_none(PushStatus.Ok)
			}
			return wrap_none(PushStatus.Duplicate)
		}
		return wrap_none(PushStatus.Denied)
	}

	public pop<P extends ConstEnum>(dyn_permissions: P, file_name: string): WrapResultEntry<T, ReadStatus> {
		if (read_write_access(dyn_permissions)) {
			const pop_find = directory_search(this.inner, file_name)
			if (pop_find) {
				this.inner.splice(pop_find.some, 1)
				return wrap_entry(ReadStatus.Ok, pop_find.result)
			}
			return wrap_entry(ReadStatus.NotFound)
		}
		return wrap_entry(ReadStatus.Denied)
	}
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