type SHA256_String = string

class Crypto {
	protected inner: string

	constructor(inner: string) {
		this.inner = inner
	}

	public async sha256_string(): Promise<string> {
		const encoder = new TextEncoder()
		const hash = await crypto.subtle.digest("SHA-256", encoder.encode(this.inner))
		const hash_as_uint8 = new Uint8Array(hash)
	    return Array.from(hash_as_uint8).map(byte => byte.toString(16).padStart(2, "0")).join("")
	}
}

export default Crypto
export {
	type SHA256_String
}