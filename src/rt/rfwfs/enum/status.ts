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

export {
	ExecuteStatus,
	ReadStatus,
	PushStatus,
}