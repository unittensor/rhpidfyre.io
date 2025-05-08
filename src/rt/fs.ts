import rfwfs, { DirectoryInRoot, Permissions } from "./rfwfs/main"

const time_now = (Date.now()/1000) | 0
const fs = new rfwfs()

const bin = rfwfs.directory_in_root({
	name: "bin",
	timestamp: time_now,
	permissions: Permissions.r | Permissions.w
})

fs.push_bulk_unsafe([
	bin.dir as DirectoryInRoot
])

export default fs