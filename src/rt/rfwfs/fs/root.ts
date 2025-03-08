import { Permissions } from "../enum"

import rfwfs from "../main"

const time_now = (Date.now()/1000)|0

// ------------ Home ------------
// /home/user/.config
const config = rfwfs.directory(".config", Permissions.rw, time_now)

// /home/user/.local
const local = rfwfs.directory(".local", Permissions.rw, time_now)

// /home/user/Downloads
const downloads = rfwfs.directory("Downloads", Permissions.rw, time_now)

// /home/user/Pictures
const pictures = rfwfs.directory("Pictures", Permissions.rw, time_now)

// /home/user/Videos
const videos = rfwfs.directory("Videos", Permissions.rw, time_now)

// /home/user/Music
const music = rfwfs.directory("Music", Permissions.rw, time_now)

// /home/user/Desktop
const desktop = rfwfs.directory("Desktop", Permissions.rw, time_now)

// /home/user
const user = rfwfs.directory("user", Permissions.r, time_now, [
	config,
	local,
	downloads,
	pictures,
	videos,
	music,
	desktop,
])

// /home/
const home = rfwfs.directory("home", Permissions.r, time_now, [user])
// ------------

// ------------ root ------------
const bin = rfwfs.directory("bin", Permissions.r, time_now, [])
// ------------

export default rfwfs.directory("/", Permissions.r, time_now, [
	bin,
	home,
])