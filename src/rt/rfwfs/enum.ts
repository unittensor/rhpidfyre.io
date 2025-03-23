type ConstEnum = number

const enum EntryType {
	Root,
	File,
	Directory,
	Binary,
}

const enum Permissions {
	r,
	w,
	x,
	rw,
	rwx,
	rx,
	wx,
	none,
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

const enum ExecuteStatus {
	Ok,
	Panic,
	Denied,
}

const enum Option {
	Ok,
	None,
}

export {
	type ConstEnum,
	ExecuteStatus,
	Permissions,
	PushStatus,
	ReadStatus,
	EntryType,
	Option,
}