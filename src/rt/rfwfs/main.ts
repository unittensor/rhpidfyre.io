import { EntryType, PushStatus, ReadStatus, Permissions, ExecuteStatus } from "./enum"
import { wrap_entry, wrap_none, type WrapResultEntry, type WrapResultNone, type WrapBinary, wrap_binary } from "./wrap"

import directory_search from "./index"

type FileInner = string | number
type BinaryError = string

type BinaryEntry = () => EntryStripped
type BinaryLambda = (binary_entry: BinaryEntry) => void

type Directory<T extends Entry> = EntryCollection<T>
type DirectoryAny = EntryCollection<Entry>
type DirectoryAnyDepth = EntryCollection<DirectoryAny>

interface Root<T extends Entry> {
	readonly type: EntryType,
	inner: T[],
}
interface EntryStripped {
	readonly type: EntryType,
	permissions: Permissions,
	timestamp: EntryValue<number>,
	name: EntryValue<string>,
}
interface Entry extends EntryStripped {
	parent: DirectoryAny,
}
interface EntryFile extends Entry {
	inner: EntryValue<FileInner>,
	hash: string,
}
interface EntryCollection<T extends Entry> extends Entry {
	inner: RfwfsDirectory<T>,
}
interface EntryBinary extends Entry {
	inner: RfwfsBinary
}

function strip_entry<T extends Entry>(entry: T): EntryStripped {
	return {
		type: entry.type,
		permissions: entry.permissions,
		timestamp: entry.timestamp,
		name: entry.name,
	}
}

function execute_access(permissions: Permissions): boolean {
	return permissions === Permissions.rwx
		|| permissions === Permissions.rx
		|| permissions === Permissions.wx
		|| permissions === Permissions.x
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
	public directory: T[];
	protected entry: Entry;

	constructor(entry: Entry, directory: T[]) {
		this.directory = directory
		this.entry = entry
	}

	public sort() {
		this.directory.sort((a,z) => a.name.inner.localeCompare(z.name.inner))
	}

	public clone(file_name: string): WrapResultEntry<T, ReadStatus> {
		if (read_write_access(this.entry.permissions)) {
			const clone_find = directory_search(this.directory, file_name)
			if (clone_find) {
				return wrap_entry(ReadStatus.Ok, { ...clone_find.result })
			}
			return wrap_entry(ReadStatus.NotFound)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public find(file_name: string): WrapResultEntry<T, ReadStatus> {
		if (read_write_access(this.entry.permissions)) {
			const file_search = directory_search(this.directory, file_name)
			if (file_search) {
				return wrap_entry(ReadStatus.Ok, file_search.result)
			}
			return wrap_entry(ReadStatus.NotFound)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push<E extends T>(entry: E): WrapResultNone<PushStatus> {
		if (read_write_access(this.entry.permissions)) {
			const no_duplicates = directory_search(this.directory, entry.name.inner)
			if (!no_duplicates) {
				this.directory.push(entry)
				this.directory.sort()
				return wrap_none(PushStatus.Ok)
			}
			return wrap_none(PushStatus.Duplicate)
		}
		return wrap_none(PushStatus.Denied)
	}

	public pop(file_name: string): WrapResultEntry<T, ReadStatus> {
		if (read_write_access(this.entry.permissions)) {
			const pop_find = directory_search(this.directory, file_name)
			if (pop_find) {
				this.directory.splice(pop_find.status, 1)
				return wrap_entry(ReadStatus.Ok, pop_find.result)
			}
			return wrap_entry(ReadStatus.NotFound)
		}
		return wrap_entry(ReadStatus.Denied)
	}
}

class RfwfsBinary {
	public lambda: BinaryLambda;
	protected entry: Entry;

	constructor(entry: Entry, lambda: BinaryLambda) {
		this.lambda = lambda
		this.entry = entry
	}

	public execute(): WrapBinary {
		if (execute_access(this.entry.permissions)) {
			try {
				this.lambda(() => strip_entry(this.entry))
			} catch(binary_e) {
				return wrap_binary(ExecuteStatus.Panic, (binary_e as object).toString())
			}
			return wrap_binary(ExecuteStatus.Ok)
		}
		return wrap_binary(ExecuteStatus.Denied)
	}
}

class rfwfs_static {
	public static is_dir<T extends Entry>(entry: T): boolean {
		return entry.type === EntryType.Directory
	}
	public static is_file<T extends Entry>(entry: T): boolean {
		return entry.type === EntryType.File
	}
	public static is_binary<T extends Entry>(entry: T): boolean {
		return entry.type === EntryType.Binary
	}
	public static is_root<T extends Entry>(entry: Root<T>): boolean {
		return entry.type === EntryType.Root
	}
}

class rfwfs<T extends Entry> extends rfwfs_static {
	protected root: Root<T>;

	constructor(inner: T[]) {
		super()
		this.root = { type: EntryType.Root, inner: inner }
	}

	public file(
		default_name: string,
		default_permissions: Permissions,
		default_parent: DirectoryAny,
		default_timestamp?: number,
		default_inner?: FileInner
	): EntryFile {
		const file = { type: EntryType.File } as EntryFile
		file.hash = "0"
		file.parent = default_parent
		file.permissions = default_permissions
		file.timestamp = new EntryValue(file, default_timestamp ? default_timestamp : (Date.now()/1000)|0)
		file.inner     = new EntryValue(file, default_inner ? default_inner : "")
		file.name      = new EntryValue(file, default_name)
		return file
	}

	public directory<T extends Entry>(
		default_name: string,
		default_permissions: Permissions,
		default_parent: DirectoryAny,
		default_timestamp?: number,
		default_inner?: T[]
	): EntryCollection<T> {
		const directory = { type: EntryType.Directory } as EntryCollection<T>
		directory.parent = default_parent
		directory.permissions = default_permissions
		directory.timestamp = new EntryValue(directory, default_timestamp ? default_timestamp : (Date.now()/1000)|0)
		directory.inner     = new RfwfsDirectory(directory, default_inner ? default_inner : [])
		directory.name      = new EntryValue(directory, default_name)
		return directory
	}

	public binary(
		default_name: string,
		default_permissions: Permissions,
		default_parent: DirectoryAny,
		default_timestamp?: number,
		default_inner?: BinaryLambda
	): EntryBinary {
		const binary = { type: EntryType.Binary } as EntryBinary
		binary.parent = default_parent
		binary.permissions = default_permissions
		binary.timestamp = new EntryValue(binary, default_timestamp ? default_timestamp : (Date.now()/1000)|0)
		binary.inner     = new RfwfsBinary(binary, default_inner ? default_inner : () => {})
		binary.name      = new EntryValue(binary, default_name)
		return binary
	}
}

export default rfwfs
export {
	type EntryCollection,
	type DirectoryAnyDepth,
	type RfwfsDirectory,
	type DirectoryAny,
	type BinaryError,
	type Directory,
	type FileInner,
	type EntryFile,
	type Entry,
}