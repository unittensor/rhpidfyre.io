import { type Entry } from "./main"
import { wrap_bsearch, type WrapBSearch } from "./wrap"

export default function directory_search<T extends Entry>(entry_collection: T[], file_name: string): WrapBSearch<T> | undefined {
	let start = 0
	let end = entry_collection.length-1
	while (start<=end) {
		const median = (start+end)>>1
		const median_name = entry_collection[median].name.inner

		if (median_name === file_name) {
			return wrap_bsearch(median, entry_collection[median])
		} else if (median_name<file_name) {
			start = median+1
		} else {
			end = median-1
		}
	}
	return undefined
}