const enum EntryType {
	Directory,
	File
}
const enum Permissions {
	r,
	w,
	rw,
	none
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
const enum Result {
	None,
	Ok
}

export {
	EntryType,
	Permissions,
	PushStatus,
	ReadStatus,
	Result,
}