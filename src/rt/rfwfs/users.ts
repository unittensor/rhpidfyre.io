import { ROOT_ID } from "./main";

import Crypto, { SHA256_String } from "../crypto/generate";
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

type WrapUserSearch = WrapResult<User | undefined, GroupSearch>

const wheel: User[] = []
const users: User[] = []

function wrap_user_search(status: GroupSearch, result?: User): WrapUserSearch {
	return wrap(result, status)
}

function groups_find_user(user_name: string): WrapUserSearch {
	const exist_in_wheel = wheel.find(user => user.get_uname() === user_name)
	if (exist_in_wheel) {
		return wrap_user_search(GroupSearch.WheelResult, exist_in_wheel)
	}
	const exist_in_users = users.find(user => user.get_uname() === user_name)
	if (exist_in_users) {
		return wrap_user_search(GroupSearch.UsersResult, exist_in_users)
	}
	return wrap_user_search(GroupSearch.NotFound)
}

function group_add(new_user: User, group: User[]): GroupSearch {
	const dups = groups_find_user(new_user.get_uname())
	if (dups.status === GroupSearch.NotFound) {
		group.push(new_user)
	}
	return dups.status
}

function group_remove(user_name: string, group: User[]): boolean {
	for (let i = 0; i<group.length; i++) {
		if (group[i].get_uname() === user_name) {
			group.splice(i, 1)
			return true
		}
	}
	return false
}

function group_wheel_add(new_user: User): GroupSearch {
	return group_add(new_user, wheel)
}

function group_wheel_remove(user_name: string): boolean {
	return group_remove(user_name, wheel)
}

function group_users_add(new_user: User): GroupSearch {
	return group_add(new_user, users)
}

function group_users_remove(user_name: string): boolean {
	return group_remove(user_name, users)
}

class user_lib {
	public static current: string = ROOT_ID.NAME
}

class User extends user_lib {
	private name: string;
	private password?: SHA256_String;

	constructor(name: string, password?: SHA256_String) {
		super()
		this.name = name
		this.password = password
	}

	public get_uname() {
		return this.name
	}

	public set_uname(new_username: string) {
		const search = groups_find_user(new_username)
		if (search.status === GroupSearch.NotFound) {

		}
	}

	public async set_password(new_password?: string): Promise<void> {
		if (new_password) {
			this.password = await new Crypto(new_password).sha256_string()
		} else {
			this.password = undefined
		}
	}
}

export default User
export {
	group_wheel_remove,
	group_users_remove,
	group_wheel_add,
	group_users_add,
	SysGroups,
}