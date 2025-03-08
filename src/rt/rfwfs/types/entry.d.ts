import { Permissions, ReadStatus } from "../enum"
import { WrapResultEntry } from "../wrap"

type FileInner = string | number
type ConstEnum = number

interface Entry {
	name: string,
	timestamp: number,
	permissions: Permissions,
	//please do not change the inner values directly on entries or else there will be catastrophic consequences
	readonly type: EntryType,
}
interface EntryFileInner {
	__body: FileInner,
	write: (item: FileInner) => boolean,
	read: () => FileInner | undefined,
}
interface EntryFile extends Entry {
	inner: EntryFileInner,
	hash: string,
}
interface EntryCollection<T extends Entry> extends Entry {
	inner: EntryCollectionManipulate<T>,
}
interface EntryCollectionManipulate<T extends Entry> {
	__body: T[],
	find: (file_name: string) => WrapResultEntry<T, ReadStatus>
	push: (entry: Entry) => PushStatus,
	sort: () => void,
	pop: (file_name: string) => WrapResultEntry<T, ReadStatus>,
}

export {
	FileInner,
	ConstEnum,
	Entry,
	EntryFile,
	EntryFileInner,
	EntryCollection,
	EntryCollectionManipulate,
}