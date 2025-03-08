import { Result } from "./enum"
import { ConstEnum, Entry } from "./types/entry"

type WrapResultEntry<T extends Entry, U> = WrapResult<T | undefined, U>
type WrapBSearch<T extends Entry> = WrapResult<T, number>
type WrapResultNone<T> = WrapResult<Result.None, T>

interface WrapResult<T, U> {
	readonly result: T,
	readonly some: U
}

function wrap<T, U>(result: T, some: U): WrapResult<T, U> {
	return { result: result, some: some }
}

function wrap_bsearch<T extends Entry>(index: number, result: T): WrapBSearch<T> {
	return wrap(result, index)
}

function wrap_entry<U extends ConstEnum, T extends Entry>(status: U, result?: T): WrapResultEntry<T, U> {
	return wrap(result, status)
}

function wrap_none<T extends ConstEnum>(status: T): WrapResultNone<T> {
	return wrap(Result.None, status)
}

export default wrap
export {
	wrap_bsearch,
	wrap_entry,
	wrap_none,
	type WrapResultEntry,
	type WrapBSearch,
	type WrapResultNone,
	type WrapResult,
}