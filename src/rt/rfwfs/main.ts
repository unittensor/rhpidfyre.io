import wrap, { type WrapResult, ConstEnum, Option } from "./wrap"

import directory_search from "./index"
import User from "./users"

const enum EntryType {
	Root,
	File,
	Directory,
	Binary,
}
const enum ROOT_ID {
	TRUNK = "/",
	NAME  = "root"
}
const enum PushStatus {
	Ok,
	Duplicate,
	Denied,
}
const enum ReadStatus {
	Ok,
	NotFound,
	Denied,
}
const enum Permissions {
	r = 1<<0,
	w = 1<<1,
	x = 1<<2,
}

interface Entry<T extends EntryType = EntryType, N = EntryValue<string>> {
	readonly type: T,
	owner: User,
	timestamp: number,
	name: N
}

interface DirectoryContainer<T> extends Entry {
	files: EntryValue<Entry[]>,
	parent: T | null
}

type Directory<T extends Entry> = DirectoryContainer<RfwfsDirectory<T>>
type DirectoryInRoot = DirectoryContainer<Root>

interface Root extends Entry<EntryType.Root, ROOT_ID.TRUNK> {
	timestamp: number,
	parent: null,
	files: EntryValue<Entry[]>,
}

interface DirectoryInRootProperties {
	permissions: Permissions,
	name: string
	timestamp: number,
}

interface DirectoryProperties<T extends Entry> extends DirectoryInRootProperties {
	parent: RfwfsDirectory<T>,
}

interface FileProperties extends Entry {

}

/** Other directory types that can be treated as a single arbitrary directory.

Do not cast.
*/
type DirectoryAssociates<T extends Entry> = Directory<T> | DirectoryInRoot | Root
/** Other entry types that can be treated as a single arbitrary entry.

Do not cast.
*/
type EntryAssociates = Entry | Root

type WrapResultEntry<T extends Entry, U> = WrapResult<T | undefined, U>
type WrapResultNone<T>                   = WrapResult<Option.None, T>

function wrap_entry<T extends ConstEnum, U extends Entry>(status: T, result?: U): WrapResultEntry<U, T> {
	return wrap(result, status)
}

function wrap_none<T extends ConstEnum>(status: T): WrapResultNone<T> {
	return wrap(Option.None, status)
}

function fs_dir_sort<T extends Entry>(dir: DirectoryAssociates<T>) {
	dir.files.inner.sort((a,z) => a.name.inner.localeCompare(z.name.inner))
}

function fs_dir_clone<T extends Entry>(dir: DirectoryAssociates<T>, file_name: string): WrapResultEntry<T, ReadStatus> {
	const clone_find = directory_search(dir.files.inner, file_name)
	if (clone_find) {
		return wrap_entry(ReadStatus.Ok, { ...clone_find.result as T })
	}
	return wrap_entry(ReadStatus.NotFound)
}

function fs_dir_find<T extends Entry>(dir: DirectoryAssociates<T>, file_name: string): WrapResultEntry<T, ReadStatus> {
	const file_search = directory_search(dir.files.inner, file_name)
	if (file_search) {
		return wrap_entry(ReadStatus.Ok, file_search.result as T)
	}
	return wrap_entry(ReadStatus.NotFound)
}

function fs_dir_push<T extends Entry>(dir: DirectoryAssociates<T>, entry: Entry) {
	const no_duplicates = directory_search(dir.files.inner, entry.name.inner)
	if (!no_duplicates) {
		dir.files.inner.push(entry)
		fs_dir_sort(dir)
		return wrap_none(PushStatus.Ok)
	}
	return wrap_none(PushStatus.Duplicate)
}

function fs_dir_pop<T extends Entry>(dir: DirectoryAssociates<T>, file_name: string): WrapResultEntry<T, ReadStatus> {
	const pop_find = directory_search(dir.files.inner, file_name)
	if (pop_find) {
		dir.files.inner.splice(pop_find.status, 1)
		return wrap_entry(ReadStatus.Ok, pop_find.result as T)
	}
	return wrap_entry(ReadStatus.NotFound)
}

class EntryValue<V> {
	public inner: V;
	protected user_perms: UserPermissions;

	constructor(user: UserPermissions, value: V) {
		this.inner = value
		this.user_perms = user
	}

	public read(): V | undefined {
		return rfwfs_lib.read_access(this.user_perms.permissions) ? this.inner : undefined
	}

	public write<T extends V>(new_value: T): boolean {
		if (rfwfs_lib.write_access(this.user_perms.permissions)) {
			this.inner = new_value
			return true
		}
		return false
	}
}

class RfwfsDirectory<T extends Entry> {
	public dir: DirectoryAssociates<T>;

	constructor(dir: DirectoryAssociates<T>) {
		this.dir = dir
	}

	public sort() {
		fs_dir_sort(this.dir)
	}

	public clone(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (rfwfs.read_write_access(this.dir.permissions)) {
			return fs_dir_clone(this.dir, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public find(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (rfwfs.read_write_access(this.dir.permissions)) {
			return fs_dir_find(this.dir, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push<E extends Entry>(entry: E): WrapResultNone<PushStatus> {
		if (rfwfs.read_write_access(this.dir.permissions)) {
			return fs_dir_push(this.dir, entry)
		}
		return wrap_none(PushStatus.Denied)
	}

	public pop(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (rfwfs.read_write_access(this.dir.permissions)) {
			fs_dir_pop(this.dir, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push_bulk_unsafe(dirs: T[]) {
		dirs.forEach(dir => this.dir.files.inner.push(dir))
		this.sort()
	}

	public push_unsafe(dir: T) {
		this.dir.files.inner.push(dir)
		this.sort()
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

	public static directory_in_root(properties: DirectoryInRootProperties): RfwfsDirectory<DirectoryInRoot> {
		class dir<P, F extends Entry> {
			public parent: P;
			public permissions: Permissions;
			public timestamp: number;
			public files: EntryValue<F[]>;
			public name: EntryValue<string>;

			constructor(permissions: Permissions, timestamp: number, name: string, parent: P, files: F[]) {
				this.parent = parent
				this.permissions = permissions
				this.timestamp = timestamp
				this.files = new EntryValue(this.permissions, files)
			}
		}
		// const dir_o = { type: EntryType.Directory } as DirectoryInRoot
		// dir_o.parent      = null
		// dir_o.permissions = properties.permissions
		// dir_o.timestamp   = properties.timestamp
		// dir_o.files       = new EntryValue(dir_o, [])
		// dir_o.name        = new EntryValue(dir_o, properties.name)
		// return new RfwfsDirectory(dir_o)
	}
	public static directory<T extends Entry>(properties: DirectoryProperties<T>): RfwfsDirectory<T> {
		const dir_o = { type: EntryType.Directory } as Directory<T>
		dir_o.parent      = properties.parent
		dir_o.permissions = properties.permissions
		dir_o.timestamp   = properties.timestamp
		dir_o.files       = new EntryValue(dir_o, [])
		dir_o.name        = new EntryValue(dir_o, properties.name)
		return new RfwfsDirectory(dir_o)
	}
	public static file(properties: FileProperties) {

	}
}

class rfwfs extends rfwfs_lib {
	public root: Root;

	constructor() {
		super()
		this.root = { type: EntryType.Root } as Root
		this.root.permissions = Permissions.r | Permissions.w
		this.root.timestamp = (Date.now()/1000) | 0
		this.root.parent = null
		this.root.files = new EntryValue(this.root, [])
		this.root.name = ROOT_ID.TRUNK
	}

	public sort() {
		fs_dir_sort(this.root)
	}

	public clone(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (rfwfs.read_write_access(this.root.permissions)) {
			return fs_dir_clone(this.root, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public find(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (rfwfs.read_write_access(this.root.permissions)) {
			return fs_dir_find(this.root, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push<T extends Entry>(entry: T): WrapResultNone<PushStatus> {
		if (rfwfs.read_write_access(this.root.permissions)) {
			return fs_dir_push(this.root, entry)
		}
		return wrap_none(PushStatus.Denied)
	}

	public pop(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (rfwfs.read_write_access(this.root.permissions)) {
			fs_dir_pop(this.root, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push_bulk_unsafe(dirs: DirectoryInRoot[]) {
		dirs.forEach(dir => this.root.files.inner.push(dir))
		this.sort()
	}

	public push_unsafe(dir: DirectoryInRoot) {
		this.root.files.inner.push(dir)
		this.sort()
	}
}

export default rfwfs
export {
	type DirectoryInRoot,
	type RfwfsDirectory,
	type Directory,
	type Entry,
	Permissions,
	EntryType,
	ROOT_ID,
}