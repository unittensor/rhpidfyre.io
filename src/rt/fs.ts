import rfwfs, { PERMISSION_FLAGS } from "./rfwfs/main"

const time_now = (Date.now()/1000) | 0
const fs = new rfwfs()

const root = fs.push_bulk_unsafe([
	rfwfs.directory_in_root({
		permissions: {wheel: PERMISSION_FLAGS.RWX, users: PERMISSION_FLAGS.NONE},
		timestamp: time_now,
		metadata: {},
		name: "bin"
	})
])

export default fs