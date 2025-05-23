import { ROOT_ID } from "./main";
import { Permissions } from "./main";

import Crypto, { type SHA256_String } from "../crypto/generate";
import groups, { groups_find_user, GroupSearch, SysGroups } from "./groups";


const enum UserSet {
	Ok,
	AlreadyLoggedIn,
	UserDoesNotExist
}

let uid_count = 0

class user_lib {
	public static current_sys_user: User;

	public static get_sys_user(): User {
		return groups.together().find(user => user.is_logged_in()) as User
	}

	public static set_sys_user(uname: string): UserSet {
		const found_user    = groups_find_user(uname)
		const result_user_i = found_user.result
		if (!result_user_i)                  { return UserSet.UserDoesNotExist }
		if (result_user_i[0].is_logged_in()) { return UserSet.AlreadyLoggedIn }

		user_lib.current_sys_user = result_user_i[0]
		return UserSet.Ok
	}
}

class User extends user_lib {
	private password?: SHA256_String;
	private current: boolean;
	private group: SysGroups;
	private name: string;
	private uid: number;

	public permissions: Permissions;

	constructor(name: string, group: SysGroups, global_perms?: Permissions, password?: SHA256_String) {
		super()

		const root_creation = name === ROOT_ID.NAME
		if (root_creation) {
			this.uid = 0
			this.group = SysGroups.Wheel
		} else {
			uid_count += 1
			this.uid = uid_count
			this.group = group
		}
		this.name = name
		this.current = root_creation
		this.password = password
		//Wheel users will have all permissions
		this.permissions = group === SysGroups.Users ? (global_perms ? global_perms : Permissions.rwx) : Permissions.rwx
	}

	private set_as_current(): boolean {
		User.get_sys_user().current = false
		User.current_sys_user = this
		this.current = true
		return this.current
	}

	public get_uid() {
		return this.uid
	}
	public is_logged_in(): boolean {
		return this.current
	}
	public get_group(): SysGroups {
		return this.group
	}
	public get_uname() {
		return this.name
	}
	public get_password(): SHA256_String | undefined {
		return this.password
	}

	public async login(password?: string): Promise<boolean> {
		if (!this.password) {
			return this.set_as_current()
		}
		if (password && await new Crypto(password).sha256_string() === this.password) {
			return this.set_as_current()
		}
		return false
	}

	public set_uname(new_uname: string): GroupSearch {
		const search = groups_find_user(new_uname)
		if (search.status === GroupSearch.NotFound) {
			this.name = new_uname
		}
		return search.status
	}

	public async set_password(new_password?: string): Promise<void> {
		if (new_password) {
			this.password = await new Crypto(new_password).sha256_string()
		} else {
			this.password = undefined
		}
	}
}

groups.wheel.add_user(
	new User(ROOT_ID.NAME, SysGroups.Wheel, "90a956efae97cca5ec584977d96a236aa76b0a07def9fcafab87fd221a1d2cfe")
)
groups.users.add_user(
	new User("user")
)

export default User