import { ReadStatus } from "../enum"
import rfwfs, { type EntryCollection, type Entry } from "../main"

import fs from "./root"

let username: string = "user"
const libhome = {} as LibHome

interface WorkingDir<T extends Entry> {
	entry?: EntryCollection<T>,
	path: string[]
}
interface LibHome {
	path: () => string[],
	get: <T extends Entry>() => EntryCollection<T>,
}

function traverse_to_goal(path: string[]) {
	if (working_dir.entry) {

	}
}

libhome.path = function() {
	return ["home", username]
}

libhome.get = function() {

}