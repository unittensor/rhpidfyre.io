import wrap, { type WrapResult, ConstEnum, Option } from "./wrap"
import { SysGroups } from "./groups"

import directory_search from "./index"
import User, { LibUser } from "./users"

const enum EntryType {
	Root,
	File,
	Directory,
	Binary,
	SymLink,
}
const enum PushStatus {
	Ok,
	Duplicate,
	Denied,
}
const enum ReadStatus {
	Ok,
	NotFound,
	NotInGroup,
	Denied,
}
const enum ModifyStatus {
	Ok,
	NotInGroup,
	Denied,
}
const enum ModifyAccessType {
	Read,
	Write,
}

const enum ROOT_ID {
	TRUNK = "/",
	NAME  = "root",
	UID   = 0,
}
const enum PERMISSION_FLAGS {
	NONE = -1,
	R    = 1 << 0,
	W    = 1 << 1,
	X    = 1 << 2,
	RWX  = PERMISSION_FLAGS.R | PERMISSION_FLAGS.W | PERMISSION_FLAGS.X
}

interface Permissions<W = Gate<PERMISSION_FLAGS>, U = Gate<PERMISSION_FLAGS>> {
	wheel: W,
	users: U,
}
type GroupPermissionsRoot = Permissions<Gate<PERMISSION_FLAGS>, Gate<PERMISSION_FLAGS.NONE>>

interface Metadata {
	[index: string]: string
}

interface Entry<
	T extends EntryType = EntryType,
	P extends Permissions = Permissions,
	N = Gate<string>
> {
	readonly type: T,
	permissions: P,
	timestamp: Gate<number>,
	metadata: Gate<Metadata>,
	group: Gate<SysGroups>,
	owner: Gate<User>,
	name: N,
}

type Directory<T extends Entry> = DirectoryContainer<RfwfsDirectory<T>>

interface DirectoryContainer<T> extends Entry {
	files: Gate<Entry[]>,
	parent: Gate<T> | null,
}

interface Root extends Entry<EntryType.Root, GroupPermissionsRoot, ROOT_ID.TRUNK> {
	parent: null,
	files: Gate<Entry[]>,
}

interface DirectoryInRoot extends Entry<EntryType.Root, Permissions {

}

interface DirectoryInRootProperties {
	permissions: Permissions<PERMISSION_FLAGS, PERMISSION_FLAGS.NONE>,
	timestamp: number,
	metadata: Metadata,
	name: string,
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
type WrapEntryRead<V>                    = WrapResult<V | undefined, ModifyStatus>

function wrap_entry<T extends ConstEnum, U extends Entry>(status: T, result?: U): WrapResultEntry<U, T> {
	return wrap(result, status)
}

function wrap_none<T extends ConstEnum>(status: T): WrapResultNone<T> {
	return wrap(Option.None, status)
}

function wrap_entry_read<V>(status: ModifyStatus, result?: V): WrapEntryRead<V> {
	return wrap(result, status)
}

function fs_dir_sort<T extends Entry>(dir: DirectoryAssociates<T>) {
	dir.files.__inner().sort((a,z) => a.name.__inner().localeCompare(z.name.__inner()))
}

function fs_dir_clone<T extends Entry>(dir: DirectoryAssociates<T>, file_name: string): WrapResultEntry<T, ReadStatus> {
	const clone_find = directory_search(dir.files.__inner(), file_name)
	if (clone_find) {
		return wrap_entry(ReadStatus.Ok, { ...clone_find.result as T })
	}
	return wrap_entry(ReadStatus.NotFound)
}

function fs_dir_find<T extends Entry>(dir: DirectoryAssociates<T>, file_name: string): WrapResultEntry<T, ReadStatus> {
	const file_search = directory_search(dir.files.__inner(), file_name)
	if (file_search) {
		return wrap_entry(ReadStatus.Ok, file_search.result as T)
	}
	return wrap_entry(ReadStatus.NotFound)
}

function fs_dir_push<T extends Entry>(dir: DirectoryAssociates<T>, entry: Entry) {
	const no_duplicates = directory_search(dir.files.__inner(), entry.name.__inner())
	if (!no_duplicates) {
		dir.files.__inner().push(entry)
		fs_dir_sort(dir)
		return wrap_none(PushStatus.Ok)
	}
	return wrap_none(PushStatus.Duplicate)
}

function fs_dir_pop<T extends Entry>(dir: DirectoryAssociates<T>, file_name: string): WrapResultEntry<T, ReadStatus> {
	const pop_find = directory_search(dir.files.__inner(), file_name)
	if (pop_find) {
		dir.files.__inner().splice(pop_find.status, 1)
		return wrap_entry(ReadStatus.Ok, pop_find.result as T)
	}
	return wrap_entry(ReadStatus.NotFound)
}

function user_group_perms(entry: EntryAssociates): PERMISSION_FLAGS | undefined {
	const user               = LibUser.current_sys_user
	const current_user_group = user.group()

	if (user.is_root() || current_user_group.type() === entry.group.__inner()) {
		return entry.permissions[current_user_group.type_as_name()].__inner()
	}
	return undefined
}

function user_group_read_write<T extends Entry>(entry: DirectoryAssociates<T>): ModifyStatus {
	if (LibUser.current_sys_user.is_root()) {
		return ModifyStatus.Ok
	}
	const group_perms = user_group_perms(entry)
	if (group_perms) {
		return LibRfwfs.read_write_access(group_perms) ? ModifyStatus.Ok : ModifyStatus.Denied
	}
	return ModifyStatus.NotInGroup
}

class Gate<V> {
	private inner: V;
	protected entry: EntryAssociates;

	constructor(entry: EntryAssociates, value: V) {
		this.inner = value
		this.entry = entry
	}

	private access_read_write(accessType: ModifyAccessType): ModifyStatus {
		const group_perms = user_group_perms(this.entry)
		if (group_perms) {
			switch (accessType) {
				case ModifyAccessType.Read:
					return LibRfwfs.read_access(group_perms)  ? ModifyStatus.Ok : ModifyStatus.Denied
				case ModifyAccessType.Write:
					return LibRfwfs.write_access(group_perms) ? ModifyStatus.Ok : ModifyStatus.Denied
			}
		}
		return ModifyStatus.NotInGroup
	}

	public __inner(): V {
		return this.inner
	}

	public read(): WrapEntryRead<V> {
		switch (this.access_read_write(ModifyAccessType.Read)) {
			case ModifyStatus.Ok:
				return wrap_entry_read(ModifyStatus.Ok, this.inner)
			case ModifyStatus.NotInGroup:
				return wrap_entry_read(ModifyStatus.NotInGroup)
			case ModifyStatus.Denied:
				return wrap_entry_read(ModifyStatus.Denied)
		}
	}

	public write<T extends V>(new_value: T): ModifyStatus {
		switch (this.access_read_write(ModifyAccessType.Read)) {
			case ModifyStatus.Ok:
				this.inner = new_value
				return ModifyStatus.Ok
			case ModifyStatus.NotInGroup:
				return ModifyStatus.NotInGroup
			case ModifyStatus.Denied:
				return ModifyStatus.Denied
		}
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
		if (user_group_read_write(this.dir)) {
			return fs_dir_clone(this.dir, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public find(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (user_group_read_write(this.dir)) {
			return fs_dir_find(this.dir, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push<E extends Entry>(entry: E): WrapResultNone<PushStatus> {
		if (user_group_read_write(this.dir)) {
			return fs_dir_push(this.dir, entry)
		}
		return wrap_none(PushStatus.Denied)
	}

	public pop(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (user_group_read_write(this.dir)) {
			fs_dir_pop(this.dir, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push_bulk_unsafe(dirs: T[]) {
		dirs.forEach(dir => this.dir.files.__inner().push(dir))
		this.sort()
	}

	public push_unsafe(dir: T) {
		this.dir.files.__inner().push(dir)
		this.sort()
	}
}

class LibRfwfs {
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
	public static is_symlink<T extends Entry>(entry: T): boolean {
		return entry.type === EntryType.SymLink
	}

	public static read_access(permissions: PERMISSION_FLAGS): boolean {
		return (permissions & PERMISSION_FLAGS.R) !== 0
	}
	public static write_access(permissions: PERMISSION_FLAGS): boolean {
		return (permissions & PERMISSION_FLAGS.W) !== 0
	}
	public static execute_access(permissions: PERMISSION_FLAGS): boolean {
		return (permissions & PERMISSION_FLAGS.X) !== 0
	}
	public static read_write_access(permissions: PERMISSION_FLAGS): boolean {
		return LibRfwfs.read_access(permissions) && LibRfwfs.write_access(permissions)
	}

	public static directory_in_root(properties: DirectoryInRootProperties): RfwfsDirectory<DirectoryInRoot> {
		const dir_o = { type: EntryType.Directory } as DirectoryInRoot
		dir_o.permissions = {
			wheel: new Gate(dir_o, properties.permissions.wheel),
			users: new Gate(dir_o, properties.permissions.users),
		}
		dir_o.metadata    = new Gate(dir_o, properties.metadata)
		dir_o.timestamp   = new Gate(dir_o, properties.timestamp)
		dir_o.files       = new Gate(dir_o, [])
		dir_o.name        = new Gate(dir_o, properties.name)
		dir_o.parent      = null
		return new RfwfsDirectory(dir_o)
	}
}

class Rfwfs extends LibRfwfs {
	public root: Root;

	constructor() {
		super()
		this.root = { type: EntryType.Root } as Root
		this.root.permissions = {
			wheel: new Gate(this.root, PERMISSION_FLAGS.RWX),
			users: new Gate(this.root, PERMISSION_FLAGS.NONE)
		}
		this.root.timestamp = new Gate(this.root, (Date.now()/1000) | 0)
		this.root.parent = null
		this.root.files = new Gate(this.root, [])
		this.root.name = ROOT_ID.TRUNK
	}

	public sort() {
		fs_dir_sort(this.root)
	}

	public clone(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (user_group_read_write(this.root)) {
			return fs_dir_clone(this.root, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public find(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (user_group_read_write(this.root)) {
			return fs_dir_find(this.root, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push<T extends Entry>(entry: T): WrapResultNone<PushStatus> {
		if (user_group_read_write(this.root)) {
			return fs_dir_push(this.root, entry)
		}
		return wrap_none(PushStatus.Denied)
	}

	public pop(file_name: string): WrapResultEntry<Entry, ReadStatus> {
		if (user_group_read_write(this.root)) {
			fs_dir_pop(this.root, file_name)
		}
		return wrap_entry(ReadStatus.Denied)
	}

	public push_bulk_unsafe(dirs: DirectoryInRoot[]) {
		dirs.forEach(dir => this.root.files.__inner().push(dir))
		this.sort()
	}

	public push_unsafe(dir: DirectoryInRoot) {
		this.root.files.__inner().push(dir)
		this.sort()
	}
}

export default Rfwfs
export {
	type DirectoryInRoot,
	type RfwfsDirectory,
	type Directory,
	type Entry,
	PERMISSION_FLAGS,
	EntryType,
	ROOT_ID,
}