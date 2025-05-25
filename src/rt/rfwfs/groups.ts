import { ROOT_ID } from "./main";

import wrap, { type WrapResult } from "./wrap";
import User from "./users";

type User_Index = [User, number]
type WrapUserSearch = WrapResult<User_Index | undefined, GroupSearch>

type SysGroupsNames = "wheel" | "users"

const enum SysGroups {
	Wheel,
	Users,
}
const enum UserMoveStatus {
	Ok,
	RootBlocked,
	MovingNonExistentUser,
	AlreadyInWheel,
	AlreadyInUsers,
}
const enum GroupRemoveStatus {
	Ok,
	RootBlocked,
	RemovingNonExistentUser,
}
const enum GroupSearch {
	NotFound,
	WheelResult,
	UsersResult,
}

interface Groups {
	wheel: Group,
	users: Group,
	together: () => User[]
}

class Group {
	protected inner: User[];
	private group_type: SysGroups;

	constructor(type: SysGroups) {
		this.group_type = type
		this.inner = []
	}

	public users(): User[] {
		return [...this.inner]
	}
	public type(): SysGroups {
		return this.group_type
	}
	public type_as_name(): SysGroupsNames {
		return this.type() === SysGroups.Wheel ? "wheel" : "users"
	}

	public add_user(user: User): boolean {
		const duplicate = this.inner.find(user_in_group => user_in_group.uname() === user.uname())
		if (!duplicate) {
			this.inner.push(user)
			return true
		}
		return false
	}

	public remove_user(user: User): User | undefined {
		for (let i = 0; i<this.inner.length; i++) {
			if (this.inner[i].uname() === user.uname()) {
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
		return [...this.wheel.users(), ...this.users.users()]
	}
}

function wrap_user_search(status: GroupSearch, result?: User_Index): WrapUserSearch {
	return wrap(result, status)
}

function group_iter_for_user(uname: string, group_t: Group): User_Index | undefined {
	const group_t_users = group_t.users()
	for (let i = 0; i<group_t_users.length; i++) {
		if (group_t_users[i].uname() === uname) {
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
	const dups = groups_find_user(new_user.uname())
	if (dups.status === GroupSearch.NotFound) {
		group_t.add_user(new_user)
	}
	return dups.status
}

function group_remove(uname: string, group_t: Group): GroupRemoveStatus {
	if (uname !== ROOT_ID.NAME) {
		const found_user = group_t.users().find(user => user.uname() === uname)
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

		groups.wheel.add_user(groups.users.remove_user((find_in_group.result as User_Index)[0]) as User)
	} else if (new_group === SysGroups.Users) {
		if (find_in_group.status === GroupSearch.UsersResult) { return UserMoveStatus.AlreadyInUsers }

		groups.users.add_user(groups.wheel.remove_user((find_in_group.result as User_Index)[0]) as User)
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

export default groups
export {
	group_wheel_remove,
	group_users_remove,
	groups_find_user,
	group_wheel_add,
	group_users_add,
	group_user_move,
	type SysGroupsNames,
	GroupRemoveStatus,
	GroupSearch,
	SysGroups,
	Group,
}