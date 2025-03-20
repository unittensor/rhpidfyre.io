import { Option, type ConstEnum } from "./enum"
import { type Entry } from "./main"

type WrapResultEntry<T extends Entry, U> = WrapResult<T | undefined, U>
type WrapBSearch<T extends Entry> = WrapResult<T, number>
type WrapResultNone<T> = WrapResult<Option.None, T>

interface WrapResult<T, U> {
	/** The resulting value if `U` is a success status */
	readonly result: T,
	/** Represents some arbitrary extra value, usually a status */
	readonly status: U,
}

function wrap<T, U>(result: T, some: U): WrapResult<T, U> {
	return { result: result, status: some }
}

function wrap_bsearch<T extends Entry>(index: number, result: T): WrapBSearch<T> {
	return wrap(result, index)
}

function wrap_entry<T extends ConstEnum, U extends Entry>(status: T, result?: U): WrapResultEntry<U, T> {
	return wrap(result, status)
}

function wrap_none<T extends ConstEnum>(status: T): WrapResultNone<T> {
	return wrap(Option.None, status)
}

export default wrap
export {
	wrap_bsearch,
	wrap_entry,
	wrap_none,
	type WrapResultEntry,
	type WrapResultNone,
	type WrapBSearch,
	type WrapResult,
}
