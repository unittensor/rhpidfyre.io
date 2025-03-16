import { EntryType, PushStatus, ReadStatus, Permissions, ConstEnum, PermissionsBinary } from "./enum"
import { wrap_entry, wrap_none, WrapResultEntry, WrapResultNone } from "./wrap"

import directory_search from "./index"

type FileInner = string | number

interface Entry {
	permissions: Permissions,
	timestamp: EntryValue<number>,
	name: EntryValue<string>,
	readonly type: EntryType,
}

interface EntryFile extends Entry {
	inner: EntryValue<FileInner>,
	hash: string,
}

interface EntryCollection<T extends Entry> extends Entry {
	inner: RfwfsDirectory<T>,
}

interface Rfwfs {
	directory: <T extends Entry>(default_name: string, default_permissions: Permissions, default_timestamp?: number, default_inner?: T[]) => EntryCollection<T>,
	file: (default_name: string, default_permissions: Permissions, default_timestamp?: number, default_inner?: FileInner) => EntryFile,
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

class EntryValue<T> {
	public inner: T;
	protected entry: Entry

	constructor(entry: Entry, inner_default: T) {
		this.inner = inner_default
		this.entry = entry
	}

	public write<I extends T>(item: I): boolean {
		if (write_access(this.entry.permissions)) {
			this.inner = item
			return true
		}
		return false
	}

	public read(): T | undefined {
		return read_access(this.entry.permissions) ? this.inner : undefined
	}
}

class RfwfsDirectory<T extends Entry> {
	public inner: T[];
	protected entry: Entry

	constructor(entry: Entry, inner: T[]) {
		this.inner = inner
		this.entry = entry
	}

	public sort() {
		this.inner.sort((a,z) => a.name.inner.localeCompare(z.name.inner))
	}

	public clone(file_name: string): WrapResultEntry<T, ReadStatus> {
		if (read_write_access(this.entry.permissions)) {
			const clone_find = directory_search(this.inner, file_name)
			if (clone_find) {
				return wrap_entry(ReadStatus.Ok, { ...clone_find.result })
			}
			return wrap_entry(ReadStatus.NotFound)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public find(file_name: string): WrapResultEntry<T, ReadStatus> {
		if (read_write_access(this.entry.permissions)) {
			const file_search = directory_search(this.inner, file_name)
			if (file_search) {
				return wrap_entry(ReadStatus.Ok, file_search.result)
			}
			return wrap_entry(ReadStatus.NotFound)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push<E extends T>(entry: E): WrapResultNone<PushStatus> {
		if (read_write_access(this.entry.permissions)) {
			const no_duplicates = directory_search(this.inner, entry.name.inner)
			if (!no_duplicates) {
				this.inner.push(entry)
				this.inner.sort()
				return wrap_none(PushStatus.Ok)
			}
			return wrap_none(PushStatus.Duplicate)
		}
		return wrap_none(PushStatus.Denied)
	}

	public pop(file_name: string): WrapResultEntry<T, ReadStatus> {
		if (read_write_access(this.entry.permissions)) {
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

class RfwfsFileContainer {
	public file: EntryFile

	constructor(default_name: string, default_permissions: Permissions, default_timestamp: number, default_inner: FileInner) {
		this.file = { type: EntryType.File } as EntryFile
		this.file.hash = "0"
		this.file.permissions = default_permissions
		this.file.timestamp = new EntryValue(this.file, default_timestamp)
		this.file.inner     = new EntryValue(this.file, default_inner)
		this.file.name      = new EntryValue(this.file, default_name)
	}
}

class RfwfsDirectoryContainer<T extends Entry> {
	public directory: EntryCollection<T>

	constructor(default_name: string, default_permissions: Permissions, default_timestamp: number, default_inner: T[]) {
		this.directory = { type: EntryType.Directory } as EntryCollection<T>
		this.directory.permissions = default_permissions
		this.directory.timestamp = new EntryValue(this.directory, default_timestamp)
		this.directory.inner     = new RfwfsDirectory(this.directory, default_inner)
		this.directory.name      = new EntryValue(this.directory, default_name)
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

rfwfs.file = function(default_name, default_permissions, default_timestamp, default_inner) {
	const file_container = new RfwfsFileContainer(
		default_name,
		default_permissions,
		default_timestamp ? default_timestamp : (Date.now()/1000)|0,
		default_inner ? default_inner : ""
	)
	return file_container.file
}

rfwfs.directory = function<T extends Entry>(default_name: string, default_permissions: Permissions, default_timestamp?: number, default_inner?: T[]): EntryCollection<T> {
	const directory_cotainer = new RfwfsDirectoryContainer(
		default_name,
		default_permissions,
		default_timestamp ? default_timestamp : (Date.now()/1000)|0,
		default_inner ? default_inner : []
	)
	return directory_cotainer.directory
}

export default rfwfs
export {
	type EntryCollection,
	type FileInner,
	type EntryFile,
	type Entry,
}