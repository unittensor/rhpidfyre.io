import { type FileInner } from "./main"

interface HashTable {
	[index: string]: FileInner
}
interface Hash {
	readonly inner: HashTable,
	sha256: (file_inner: FileInner) => Promise<string>,
	push: (hash: string) => void,
	find: (hash: string) => FileInner | undefined,
	pop: (hash: string) => FileInner | undefined,
}

async function sha256(inner_as_string: string): Promise<string> {
	const encoder = new TextEncoder()
	const hash = await crypto.subtle.digest("SHA-256", encoder.encode(inner_as_string))
	const hash_as_uint8 = new Uint8Array(hash)
	return Array.from(hash_as_uint8).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

const hash_table = { inner: {} } as Hash

hash_table.sha256 = async function(file_inner) {
	return await sha256(file_inner.toString())
}

hash_table.find = function(hash) {
	const hash_entry = this.inner[hash]
	if (hash_entry) {
		return hash_entry
	}
	return undefined
}

hash_table.pop = function(hash) {
	const hash_entry = this.find(hash)
	if (hash_entry) {
		delete this.inner[hash_entry]
		return hash_entry
	}
	return undefined
}

hash_table.push = function(hash) {

}

export default hash_table
export {
	type HashTable,
}