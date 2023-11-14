import { Matrix4 } from "three"
import type { float } from "../../@types/numbers"

const Rotation = class {
	constructor() {}

	public XW(Angle: float): Matrix4 {
		return new Matrix4().set(
			Math.cos(Angle), 0, 0, -Math.sin(Angle),
			0, 1, 0, 0,
			0, 0, 1, 0,
			Math.sin(Angle), 0, 0, Math.cos(Angle)
		)
	}

	public YW(Angle: float): Matrix4 {
		return new Matrix4().set(
			1, 0, 0, 0,
			0, Math.cos(Angle), 0, Math.sin(Angle),
			0, 0, 1, 0,
			0, -Math.sin(Angle), 0, Math.cos(Angle)
		)
	}

	public ZW(Angle: float): Matrix4 {
		return new Matrix4().set(
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, Math.cos(Angle), -Math.sin(Angle),
			0, 0, Math.sin(Angle), Math.cos(Angle)
		)
	}
}

const Project = (w: float): Matrix4 => new Matrix4().set(
	1/-1.5+w, 0, 0, 0,
	0, 1/-1.5+w, 0, 0,
	0, 0, 1/-1.5+w, 0,
	0, 0, 0, 0
)

export {
	Rotation,
	Project
}