import { Permissions } from "./rfwfs/main"

import rfwfs from "./rfwfs/main"

const time_now = (Date.now()/1000) | 0

const fs = new rfwfs()

fs.add_file(default_name, default_permissions)

export default fs