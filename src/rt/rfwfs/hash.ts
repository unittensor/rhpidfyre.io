async function hash(inner_as_string: string) {
	const encoder = new TextEncoder()
	const hash = await crypto.subtle.digest("SHA-256", encoder.encode(inner_as_string))
	const hash_as_uint8 = new Uint8Array(hash)
    return Array.from(hash_as_uint8).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

export default async function generate_sha256(inner_as_string: string) {
	const sha256 = await hash(inner_as_string)
	return sha256
}