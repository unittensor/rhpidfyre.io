import { Permissions } from "./rfwfs/main"

import rfwfs from "./rfwfs/main"

const time_now = (Date.now()/1000)|0

const fs = new rfwfs([
	rfwfs.directory("bin", Permissions.r, fs, time_now)
])


export default fs