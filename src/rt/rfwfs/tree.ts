import rfwfs, { Permissions } from "./main";

const time_now = (Date.now()/1000)|0

const fs = rfwfs.new_collection([
	rfwfs.new_entry("/", Permissions.r, time_now, rfwfs.new_collection([
		rfwfs.new_entry("home", Permissions.r, time_now, "hi")
	]))
])

export default fs