type ConstEnum = number

const enum EntryType {
	Directory,
	Binary,
	File,
}
const enum Permissions {
	r,
	w,
	rw,
	none,
}
const enum PermissionsBinary {
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
const enum Option {
	Ok,
	None,
}

export {
	type ConstEnum,
	PermissionsBinary,
	Permissions,
	PushStatus,
	ReadStatus,
	EntryType,
	Option,
}