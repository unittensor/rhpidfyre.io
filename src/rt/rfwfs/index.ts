import { type Entry } from "./main"

interface Wrap<T> {
	readonly result: T,
	readonly index: number
}
function wrap_result<T>(result: T, index: number): Wrap<T> {
	return { result: result, index: index }
}

export default function entry_search<T extends Entry>(entry_collection: T[], file_name: string): Wrap<T> | undefined {
	let start = 0
	let end = entry_collection.length-1
	while (start<=end) {
		const median = (start+end)>>1
		const median_name = entry_collection[median].name

		if (median_name === file_name) {
			return wrap_result(entry_collection[median], median)
		} else if (median_name<file_name) {
			start = median+1
		} else {
			end = median-1
		}
	}
	return undefined
}