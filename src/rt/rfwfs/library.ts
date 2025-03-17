import { ReadStatus } from "./enum"
import { wrap_entry, type WrapResultEntry } from "./wrap"

import rfwfs, { type DirectoryDepth, type Directory } from "./main"
import fs from "../fs"

type Path = string[]

interface LibHome {
	goal: (path: Path) => WrapResultEntry<Directory, ReadStatus>
	path: () => Path,
	get: () => Directory | undefined,
}

let username: string = "user"

const libhome = {} as LibHome

libhome.goal = function(path) {
	let traverse = fs

	for (const path_name of path) {
		const find = traverse.inner.find(path_name)

		if (find.status === ReadStatus.Ok) {
			if (find.result && rfwfs.is_dir(find.result)) {
				traverse = find.result as DirectoryDepth
			} else {
				return wrap_entry(ReadStatus.Denied)
			}
		} else {
			return wrap_entry(find.status)
		}
	}
	return wrap_entry(ReadStatus.Ok, traverse)
}

libhome.path = function() {
	return ["home", username]
}

libhome.get = function() {
	const traverse = this.goal(this.path())
	return traverse.status === ReadStatus.Ok ? traverse.result : undefined
}

export default libhome