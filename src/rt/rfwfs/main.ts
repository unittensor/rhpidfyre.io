import { ReadStatus, PushStatus, ExecuteStatus } from "./enum/status"
import { wrap_entry, wrap_none, wrap_binary, type WrapResultEntry, type WrapResultNone, type WrapBinary } from "./wrap"

import directory_search from "./index"

const enum EntryType {
	Root,
	File,
	Directory,
	Binary,
}
const enum Permissions {
	r    = 1<<0,
	w    = 1<<1,
	x    = 1<<2,
	none = 1<<3,
}
const enum ROOT_ID { TRUNK = "/" }

type FileInner = string | number
type BinaryError = string

type BinaryEntry = () => EntryStripped
type BinaryLambda = (binary_entry: BinaryEntry) => void

type Directory<T extends Entry> = EntryCollection<T>
type DirectoryAny = EntryCollection<Entry>
type DirectoryAnyDepth = EntryCollection<DirectoryAny>

interface EntryStripped {
	readonly type: EntryType,
	permissions: Permissions,
	timestamp: EntryValue<number>,
	name: EntryValue<string>,
}

interface Entry<T = DirectoryAny | null> extends EntryStripped {
	parent: T,
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

interface Root<T extends Entry> {
	readonly type: EntryType,
	readonly permissions: Permissions,
	readonly timestamp: EntryValueRoot<number>,
	readonly parent: null,
	readonly inner: RfwfsRootDirectory<T>,
	readonly name: ROOT_ID.TRUNK,
}

function strip_entry<T extends Entry>(entry: T): EntryStripped {
	return {
		type: entry.type,
		permissions: entry.permissions,
		timestamp: entry.timestamp,
		name: entry.name,
	}
}

function fs_dir_clone<T extends Entry>(directory: T[], file_name: string): WrapResultEntry<T, ReadStatus> {
	const clone_find = directory_search(directory, file_name)
	if (clone_find) {
		return wrap_entry(ReadStatus.Ok, { ...clone_find.result })
	}
	return wrap_entry(ReadStatus.NotFound)
}

function fs_dir_find<T extends Entry>(directory: T[], file_name: string): WrapResultEntry<T, ReadStatus> {
	const file_search = directory_search(directory, file_name)
	if (file_search) {
		return wrap_entry(ReadStatus.Ok, file_search.result)
	}
	return wrap_entry(ReadStatus.NotFound)
}

function fs_dir_push<T extends Entry, E extends T>(directory: T[], entry: E) {
	const no_duplicates = directory_search(directory, entry.name.inner)
	if (!no_duplicates) {
		directory.push(entry)
		directory.sort()
		return wrap_none(PushStatus.Ok)
	}
	return wrap_none(PushStatus.Duplicate)
}

function fs_dir_pop<T extends Entry>(directory: T[], file_name: string): WrapResultEntry<T, ReadStatus> {
	const pop_find = directory_search(directory, file_name)
	if (pop_find) {
		directory.splice(pop_find.status, 1)
		return wrap_entry(ReadStatus.Ok, pop_find.result)
	}
	return wrap_entry(ReadStatus.NotFound)
}

class EntryValue<T> {
	public inner: T;
	protected entry: Entry;

	constructor(entry: Entry, inner_default: T) {
		this.inner = inner_default
		this.entry = entry
	}

	/**
	Safe write
	*/
	public write<I extends T>(item: I): boolean {
		if (rfwfs.write_access(this.entry.permissions)) {
			this.inner = item
			return true
		}
		return false
	}

	/**
	Convert the inner file value

	Same as `write` but mutates the inner value `T` into a `FileInner`
	*/
	public write_into(item: FileInner): boolean {
		return this.write(item as T)
	}

	public read(): T | undefined {
		return rfwfs.write_access(this.entry.permissions) ? this.inner : undefined
	}
}

class EntryValueRoot<T> {
	protected inner: T;

	constructor(inner: T) {
		this.inner = inner
	}

	public read(): T {
		return this.inner
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
		if (rfwfs.read_write_access(this.entry.permissions)) {
			return fs_dir_clone(this.directory, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public find(file_name: string): WrapResultEntry<T, ReadStatus> {
		if (rfwfs.read_write_access(this.entry.permissions)) {
			return fs_dir_find(this.directory, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push<E extends T>(entry: E): WrapResultNone<PushStatus> {
		if (rfwfs.read_write_access(this.entry.permissions)) {
			return fs_dir_push(this.directory, entry)
		}
		return wrap_none(PushStatus.Denied)
	}

	public pop(file_name: string): WrapResultEntry<T, ReadStatus> {
		if (rfwfs.read_write_access(this.entry.permissions)) {
			fs_dir_pop(this.directory, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}
}

class RfwfsRootDirectory<T extends Entry> {
	public directory: T[];

	constructor() {
		this.directory = []
	}

	public sort() {
		this.directory.sort((a,z) => a.name.inner.localeCompare(z.name.inner))
	}

	public clone(file_name: string): WrapResultEntry<T, ReadStatus> {
		return fs_dir_clone(this.directory, file_name)
	}

	public find(file_name: string): WrapResultEntry<T, ReadStatus> {
		return fs_dir_find(this.directory, file_name)
	}

	public push<E extends T>(entry: E): WrapResultNone<PushStatus> {
		return fs_dir_push(this.directory, entry)
	}

	public pop(file_name: string): WrapResultEntry<T, ReadStatus> {
		return fs_dir_pop(this.directory, file_name)
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
		if (rfwfs.execute_access(this.entry.permissions)) {
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

class rfwfs_lib {
	public static is_root<T extends Entry>(entry: T): boolean {
		return entry.type === EntryType.Root
	}
	public static is_dir<T extends Entry>(entry: T): boolean {
		return entry.type === EntryType.Directory
	}
	public static is_file<T extends Entry>(entry: T): boolean {
		return entry.type === EntryType.File
	}
	public static is_binary<T extends Entry>(entry: T): boolean {
		return entry.type === EntryType.Binary
	}

	public static read_access(permissions: Permissions): boolean {
		return (permissions & Permissions.r) !== 0
	}
	public static write_access(permissions: Permissions): boolean {
		return (permissions & Permissions.w) !== 0
	}
	public static execute_access(permissions: Permissions): boolean {
		return (permissions & Permissions.x) !== 0
	}
	public static read_write_access(permissions: Permissions): boolean {
		return rfwfs.read_access(permissions) && rfwfs.write_access(permissions)
	}
}

class rfwfs<T extends Entry> extends rfwfs_lib {
	public root: Root<T>;

	constructor() {
		super()
		this.root = {
			type: EntryType.Root,
			permissions: Permissions.r | Permissions.w,
			timestamp: new EntryValueRoot((Date.now()/1000) | 0),
			parent: null,
			inner: new RfwfsRootDirectory(),
			name: ROOT_ID.TRUNK,
		} as Root<T>
	}

	public push_directory_into_root<T extends Entry>(dir: EntryCollection<T>): EntryCollection<T> {
		this.root.inner.push(dir)
		return dir
	}

	public static file(
		default_name: string,
		default_permissions: Permissions,
		default_parent: DirectoryAny,
		default_timestamp?: number,
		default_inner?: FileInner
	): EntryFile {
		const file = { type: EntryType.File } as EntryFile
		file.hash = "0"
		file.permissions = default_permissions
		file.parent = default_parent
		file.timestamp = new EntryValue(file, default_timestamp ? default_timestamp : (Date.now()/1000) | 0)
		file.inner     = new EntryValue(file, default_inner ? default_inner : "")
		file.name      = new EntryValue(file, default_name)
		return file
	}

	public static directory<T extends Entry>(
		default_name: string,
		default_permissions: Permissions,
		default_parent: DirectoryAny,
		default_timestamp?: number,
		default_inner?: T[]
	): EntryCollection<T> {
		const directory = { type: EntryType.Directory } as EntryCollection<T>
		directory.parent = default_parent
		directory.permissions = default_permissions
		directory.timestamp = new EntryValue(directory, default_timestamp ? default_timestamp : (Date.now()/1000) | 0)
		directory.inner     = new RfwfsDirectory(directory, default_inner ? default_inner : [])
		directory.name      = new EntryValue(directory, default_name)
		return directory
	}

	public static binary(
		default_name: string,
		default_permissions: Permissions,
		default_parent: DirectoryAny,
		default_timestamp?: number,
		default_inner?: BinaryLambda
	): EntryBinary {
		const binary = { type: EntryType.Binary } as EntryBinary
		binary.parent = default_parent
		binary.permissions = default_permissions
		binary.timestamp = new EntryValue(binary, default_timestamp ? default_timestamp : (Date.now()/1000) | 0)
		binary.inner     = new RfwfsBinary(binary, default_inner ? default_inner : () => {})
		binary.name      = new EntryValue(binary, default_name)
		return binary
	}
}

export default rfwfs
export {
	type DirectoryAnyDepth,
	type EntryCollection,
	type RfwfsDirectory,
	type DirectoryAny,
	type BinaryError,
	type Directory,
	type FileInner,
	type EntryFile,
	type Entry,
	Permissions,
	EntryType,
	ROOT_ID,
}