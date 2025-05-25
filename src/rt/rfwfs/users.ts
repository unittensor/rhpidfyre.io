import { ROOT_ID } from "./main";

import Crypto, { type SHA256 } from "../crypto/generate";
import groups, { groups_find_user, GroupSearch, SysGroups, Group } from "./groups";

const enum UserSet {
	Ok,
	AlreadyLoggedIn,
	UserDoesNotExist,
}
const enum PasswordCheckStatus {
	Ok,
	MinBound,
	MaxBound,
}
const enum PasswordSetStatus {
	Ok,
	RootRequiresPassword,
	MinBound,
	MaxBound,
	Incorrect,
}
const enum SetUnameStatus {
	Ok,
	CantChangeRootName,
	NotFound,
	WheelResult,
	UsersResult,
}

const enum PASS_BOUNDS {
	MIN = 4,
	MAX = 1 << 12, //64 ^ 2
}

let uid_count: number = 0

class LibUser {
	public static current_sys_user: User;

	public static get_sys_user(): User {
		return groups.together().find(user => user.is_logged_in()) as User
	}

	public static set_sys_user(uname: string): UserSet {
		const found_user    = groups_find_user(uname)
		const result_user_i = found_user.result
		if (!result_user_i)                  { return UserSet.UserDoesNotExist }
		if (result_user_i[0].is_logged_in()) { return UserSet.AlreadyLoggedIn }

		LibUser.current_sys_user = result_user_i[0]
		return UserSet.Ok
	}

	public static in_password_bounds(password: string): PasswordCheckStatus {
		//Math.min(Math.max(PASS_BOUNDS.MIN, password.length), PASS_BOUNDS.MAX) < PASS_BOUNDS.MAX
		if (password.length > PASS_BOUNDS.MIN) {
			if (password.length < PASS_BOUNDS.MAX) {
				return PasswordCheckStatus.Ok
			}
			return PasswordCheckStatus.MaxBound
		}
		return PasswordCheckStatus.MinBound
	}
}

class User {
	private inner_password?: SHA256;
	private inner_group: Group;
	private inner_name: string;
	private inner_uid: number;
	private current: boolean;

	constructor(name: string, group: Group, password?: SHA256) {
		const root_creation = name === ROOT_ID.NAME
		if (root_creation) {
			this.inner_uid = 0
			this.inner_group = group
		} else {
			uid_count += 1
			this.inner_uid = uid_count
			this.inner_group = group
		}

		this.inner_name = name
		this.current = root_creation
		this.inner_password = password
	}

	private set_as_current(): boolean {
		LibUser.get_sys_user().current = false
		LibUser.current_sys_user = this
		this.current = true
		return this.current
	}

	public is_logged_in(): boolean {
		return this.current
	}
	public in_wheel(): boolean {
		return this.inner_group.type() === SysGroups.Wheel
	}
	public password(): SHA256 | undefined {
		return this.inner_password
	}
	public is_root(): boolean {
		return this.inner_name === ROOT_ID.NAME && this.inner_uid === ROOT_ID.UID
	}
	public group(): Group {
		return this.inner_group
	}
	public uname(): string {
		return this.inner_name
	}
	public uid(): number {
		return this.inner_uid
	}

	public async check_password(password?: string): Promise<boolean> {
		if (!(password && this.inner_password) || (await new Crypto(password).sha256_hash()).secret === this.inner_password.secret) {
			return true
		}
		return false
	}

	public async login(password?: string): Promise<boolean> {
		if (!this.inner_password || (password && await this.check_password(password))) {
			return this.set_as_current()
		}
		return false
	}

	public set_uname(new_uname: string): SetUnameStatus {
		if (this.is_root()) { return SetUnameStatus.CantChangeRootName }

		const search = groups_find_user(new_uname)
		switch (search.status) {
			case GroupSearch.NotFound:
				this.inner_name = new_uname
				break
			case GroupSearch.UsersResult:
				return SetUnameStatus.UsersResult
			case GroupSearch.WheelResult:
				return SetUnameStatus.WheelResult
		}
		return SetUnameStatus.Ok
	}

	public async set_password(current_password: string, new_password?: string): Promise<PasswordSetStatus> {
		if (await this.check_password(current_password)) {
			if (new_password) {
				switch (LibUser.in_password_bounds(new_password)) {
					case PasswordCheckStatus.Ok:
						this.inner_password = await new Crypto(new_password).sha256_hash()
						break
					case PasswordCheckStatus.MinBound:
						return PasswordSetStatus.MinBound
					case PasswordCheckStatus.MaxBound:
						return PasswordSetStatus.MaxBound
				}
			} else {
				if (this.is_root()) { return PasswordSetStatus.RootRequiresPassword }
				//This user has no password
				this.inner_password = undefined
			}
			return PasswordSetStatus.Ok
		}
		return PasswordSetStatus.Incorrect
	}
}

groups.wheel.add_user(
	new User(ROOT_ID.NAME, groups.wheel, { secret: "90a956efae97cca5ec584977d96a236aa76b0a07def9fcafab87fd221a1d2cfe" })
)
groups.users.add_user(
	new User("user", groups.users)
)

export default User
export {
	LibUser
}