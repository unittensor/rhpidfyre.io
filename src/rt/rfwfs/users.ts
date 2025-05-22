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
const enum UserSet {
	Ok,
	AlreadyLoggedIn,
	UserDoesNotExist
}
const enum GroupRemoveStatus {
	Ok,
	RootBlocked,
	RemovingNonExistentUser,
}

type User_Index = [User, number]
type WrapUserSearch = WrapResult<User_Index | undefined, GroupSearch>

interface Groups {
	wheel: Group,
	users: Group,
	together: () => User[]
}

class Group {
	protected inner: User[];
	private type: SysGroups;

	constructor(type: SysGroups) {
		this.type = type
		this.inner = []
	}

	public get_type(): SysGroups {
		return this.type
	}

	public get_users(): User[] {
		return [...this.inner]
	}

	public add_user(user: User): void {
		this.inner.push(user)
	}

	public remove_user(user: User): User | undefined {
		for (let i = 0; i<this.inner.length; i++) {
			if (this.inner[i].get_uname() === user.get_uname()) {
				this.inner.splice(i, 1)
				return this.inner[i]
			}
		}
		return undefined
	}
}

const groups: Groups = {
	wheel: new Group(SysGroups.Wheel),
	users: new Group(SysGroups.Users),
	together: function() {
		return [...this.wheel.get_users(), ...this.users.get_users()]
	}
}

let uid_count = 0

function wrap_user_search(status: GroupSearch, result?: User_Index): WrapUserSearch {
	return wrap(result, status)
}

function group_iter_for_user(uname: string, group_t: Group): User_Index | undefined {
	const group_t_users = group_t.get_users()
	for (let i = 0; i<group_t_users.length; i++) {
		if (group_t_users[i].get_uname() === uname) {
			return [group_t_users[i], i]
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
		group_t.add_user(new_user)
	}
	return dups.status
}

function group_remove(uname: string, group_t: Group): GroupRemoveStatus {
	if (uname !== ROOT_ID.NAME) {
		const found_user = group_t.get_users().find(user => user.get_uname() === uname)
		if (found_user) {
			group_t.remove_user(found_user)
			return GroupRemoveStatus.Ok
		}
		return GroupRemoveStatus.RemovingNonExistentUser
	}
	return GroupRemoveStatus.RootBlocked
}

function group_user_move(uname: string, new_group: SysGroups): UserMoveStatus {
	if (uname === ROOT_ID.NAME) { return UserMoveStatus.RootBlocked }

	const find_in_group = groups_find_user(uname)
	if (find_in_group.status === GroupSearch.NotFound) { return UserMoveStatus.MovingNonExistentUser }

	if (new_group === SysGroups.Wheel) {
		if (find_in_group.status === GroupSearch.WheelResult) { return UserMoveStatus.AlreadyInWheel }
		const removed_users_user = groups.users.remove_user((find_in_group.result as User_Index)[0])
		groups.wheel.add_user(removed_users_user as User)
	} else if (new_group === SysGroups.Users) {
		if (find_in_group.status === GroupSearch.UsersResult) { return UserMoveStatus.AlreadyInUsers }
		const removed_wheel_user = groups.wheel.remove_user((find_in_group.result as User_Index)[0])
		groups.users.add_user(removed_wheel_user as User)
	}
	return UserMoveStatus.Ok
}

function group_wheel_add(new_user: User): GroupSearch {
	return group_add(new_user, groups.wheel)
}

function group_wheel_remove(uname: string): GroupRemoveStatus {
	return group_remove(uname, groups.wheel)
}

function group_users_add(new_user: User): GroupSearch {
	return group_add(new_user, groups.users)
}

function group_users_remove(uname: string): GroupRemoveStatus {
	return group_remove(uname, groups.users)
}

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
	private current: boolean;
	private name: string;
	private password?: SHA256_String;
	private uid: number;

	constructor(name: string, password?: SHA256_String) {
		super()

		const root_creation = name === ROOT_ID.NAME
		if (root_creation) {
			this.uid = 0
		} else {
			uid_count += 1
			this.uid = uid_count
		}
		this.name = name
		this.current = root_creation
		this.password = password
	}

	public get_uid() {
		return this.uid
	}

	public is_logged_in(): boolean {
		return this.current
	}

	public login(password?: SHA256_String): boolean {
		if (password === this.password) {
			const other_user = User.get_sys_user()
			other_user.current = false
			this.current = true
			User.current_sys_user = this
			return this.current
		}
		return false
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
	new User(ROOT_ID.NAME, "9025f0dd51ed4f2b2dc2791b6a15eff804555c283bac50d1d8923c18a51f977b")
)
groups.users.push(
	new User("user")
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