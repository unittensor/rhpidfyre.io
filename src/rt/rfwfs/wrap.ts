const enum Option {
	None,
	Some,
}

type ConstEnum = number

interface WrapResult<T, U> {
	/** The resulting value if `U` is a success status */
	readonly result: T,
	/** Represents some arbitrary extra value, usually a status */
	readonly status: U,
}

function wrap<T, U>(result: T, some: U): WrapResult<T, U> {
	return { result: result, status: some }
}

export default wrap
export {
	type WrapResult,
	type ConstEnum,
	Option,
}