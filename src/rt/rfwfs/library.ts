import { ReadStatus } from "./enum"
import { wrap_entry, type WrapResultEntry } from "./wrap"

import rfwfs, { type DirectoryAny, type EntryCollection, type DirectoryAnyDepth } from "./main"
import fs from "../fs"

type Path = string[]

interface Home {
	path: () => Path,
	dir: () => DirectoryAny | undefined,
}
interface Librfwfs {
	home: Home,
	traverse_to: (path: Path) => WrapResultEntry<DirectoryAny, ReadStatus>
	pwd_entry: <T extends EntryCollection<T>>(working_dir: T) => Path | undefined
}

let username: string = "user"

const librfwfs = {} as Librfwfs

librfwfs.traverse_to = function(path) {
	let traverse = fs

	for (const path_name of path) {
		const find = traverse.inner.find(path_name)

		if (find.status === ReadStatus.Ok) {
			if (find.result && rfwfs.is_dir(find.result)) {
				traverse = find.result as DirectoryAnyDepth
			} else {
				return wrap_entry(ReadStatus.Denied)
			}
		} else {
			return wrap_entry(find.status)
		}
	}
	return wrap_entry(ReadStatus.Ok, traverse)
}

librfwfs.pwd_entry = function(working_dir) {

}

librfwfs.home = {} as Home

librfwfs.home.path = function() {
	return ["home", username]
}

librfwfs.home.dir = function() {
	const traverse = librfwfs.traverse_to(this.path())
	return traverse.status === ReadStatus.Ok ? traverse.result : undefined
}

export default librfwfs
export {
	username
}