import { ReadStatus } from "../../../rfwfs/enum"
import type { Args, Term } from "../list"

import lib from "../../../rfwfs/library"
import stdout from "../../../elements/stdout"

export default function cd(term: Term, args: Args): boolean {
	const new_dir_status = lib.traverse_to(args)

	if (new_dir_status === SetDirStatus.NotADirectory) {
		term.appendChild(stdout(`cd: "${args[1]}" is not a directory`))
	} else if (new_dir_status === SetDirStatus.NotFound) {
		term.appendChild(stdout(`cd: The directory "${args[1]}" does not exist`))
	}
	return true
}