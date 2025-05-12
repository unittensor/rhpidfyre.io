import { type Entry } from "./main"
import wrap, { WrapResult } from "./wrap"

function wrap_bsearch<T extends Entry>(index: number, result: T): WrapResult<T, number> {
	return wrap(result, index)
}

export default function directory_search<T extends Entry>(dir_files: T[], file_name: string): WrapResult<T, number> | undefined {
	let start = 0
	let end = dir_files.length-1
	while (start<=end) {
		const median = (start+end)>>1
		const median_name = dir_files[median].name.inner

		if (median_name === file_name) {
			return wrap_bsearch(median, dir_files[median])
		} else if (median_name<file_name) {
			start = median+1
		} else {
			end = median-1
		}
	}
	return undefined
}