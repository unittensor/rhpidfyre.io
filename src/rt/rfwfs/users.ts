import { ROOT_ID } from "./main";

import Crypto, { type SHA256_String } from "../crypto/generate";
import wrap, { type WrapResult } from "./wrap";

const enum SysGroups {
	Wheel,
	Users,
}
const enum GroupSearch {
	NotFound,
	WheelResult,
	UsersResult,
}
const enum UserMoveStatus {
	Ok,
	RootBlocked,
	MovingNonExistentUser,
	AlreadyInWheel,
	AlreadyInUsers,
}
const enum SettingUser {
	Ok,
	AlreadyLoggedIn,
	UserDoesNotExist
}

type Group = User[]
type User_Index = [User, number]
type WrapUserSearch = WrapResult<User_Index | undefined, GroupSearch>

type WheelAndUsers = Group
interface Groups {
	wheel: Group,
	users: Group,
	together: () => WheelAndUsers
}

const groups: Groups = {
	wheel: [],
	users: [],
	together: function() {
		return [...this.wheel, ...this.users]
	}
}

function wrap_user_search(status: GroupSearch, result?: User_Index): WrapUserSearch {
	return wrap(result, status)
}

function group_iter_for_user(uname: string, group_t: Group): User_Index | undefined {
	for (let i = 0; i<group_t.length; i++) {
		if (group_t[i].get_uname() === uname) {
			return [group_t[i], i]
		}
	}
	return undefined
}

function groups_find_user(uname: string): WrapUserSearch {
	const exist_in_wheel = group_iter_for_user(uname, groups.wheel)
	if (exist_in_wheel) {
		return wrap_user_search(GroupSearch.WheelResult, exist_in_wheel)
	}
	const exist_in_users = group_iter_for_user(uname, groups.users)
	if (exist_in_users) {
		return wrap_user_search(GroupSearch.UsersResult, exist_in_users)
	}
	return wrap_user_search(GroupSearch.NotFound)
}

function group_add(new_user: User, group_t: Group): GroupSearch {
	const dups = groups_find_user(new_user.get_uname())
	if (dups.status === GroupSearch.NotFound) {
		group_t.push(new_user)
	}
	return dups.status
}

function group_remove(uname: string, group_t: Group): boolean {
	if (uname !== ROOT_ID.NAME) {
		const find_user = group_iter_for_user(uname, group_t)
		if (find_user) {
			group_t.splice(find_user[1], 1)
			return true
		}
	}
	return false
}

function group_user_move(uname: string, new_group: SysGroups): UserMoveStatus {
	if (uname === ROOT_ID.NAME) { return UserMoveStatus.RootBlocked }

	const find_in_group = groups_find_user(uname)
	if (find_in_group.status === GroupSearch.NotFound) { return UserMoveStatus.MovingNonExistentUser }

	if (new_group === SysGroups.Wheel) {
		if (find_in_group.status === GroupSearch.WheelResult) { return UserMoveStatus.AlreadyInWheel }

		groups.wheel.push(groups.users.splice((find_in_group.result as User_Index)[1], 1)[0])
	} else if (new_group === SysGroups.Users) {
		if (find_in_group.status === GroupSearch.UsersResult) { return UserMoveStatus.AlreadyInUsers }

		groups.users.push(groups.wheel.splice((find_in_group.result as User_Index)[1], 1)[0])
	}
	return UserMoveStatus.Ok
}

function group_wheel_add(new_user: User): GroupSearch {
	return group_add(new_user, groups.wheel)
}

function group_wheel_remove(uname: string): boolean {
	return group_remove(uname, groups.wheel)
}

function group_users_add(new_user: User): GroupSearch {
	return group_add(new_user, groups.users)
}

function group_users_remove(uname: string): boolean {
	return group_remove(uname, groups.users)
}

class user_lib {
	public static current_sys_user: User;

	public static get_sys_user(): User {
		return groups.together().find(user => user.is_logged_in()) as User
	}

	public static set_sys_user(uname: string): SettingUser {
		const found_user    = groups_find_user(uname)
		const result_user_i = found_user.result
		if (!result_user_i)                  { return SettingUser.UserDoesNotExist }
		if (result_user_i[0].is_logged_in()) { return SettingUser.AlreadyLoggedIn }

		user_lib.current_sys_user = result_user_i[0]
		return SettingUser.Ok
	}
}

class User extends user_lib {
	private current: boolean;
	private name: string;
	private password?: SHA256_String;

	constructor(name: string, password?: SHA256_String) {
		super()
		this.name = name
		this.current = name === ROOT_ID.NAME
		this.password = password
	}

	public is_logged_in(): boolean {
		return this.current
	}

	public login(password?: SHA256_String): boolean {
		if (password !== this.password) { return false }

		for (const other_user of groups.together()) {
			if (other_user.is_logged_in()) {
				other_user.current = false
				this.current = true
				break
			}
		}
		return this.current
	}

	public get_uname() {
		return this.name
	}

	public set_uname(new_uname: string): GroupSearch {
		const search = groups_find_user(new_uname)
		if (search.status === GroupSearch.NotFound) {
			this.name = new_uname
		}
		return search.status
	}

	public get_password(): SHA256_String | undefined {
		return this.password
	}

	public async set_password(new_password?: string): Promise<void> {
		if (new_password) {
			this.password = await new Crypto(new_password).sha256_string()
		} else {
			this.password = undefined
		}
	}
}

groups.wheel.push(
	new User(ROOT_ID.NAME),
	new User("rhpidfyre", "9025f0dd51ed4f2b2dc2791b6a15eff804555c283bac50d1d8923c18a51f977b")
)

export default User
export {
	group_wheel_remove,
	group_users_remove,
	group_wheel_add,
	group_users_add,
	group_user_move,
	SysGroups,
}