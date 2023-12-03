import type {float, u16, u64} from "../../@types/numbers"

type Radian = float

const Deg = (Degree: u16): Radian => Degree*Math.PI/180
const RandArbitrary = (min: u64, max: u64): float => min+max*Math.random()-min*Math.random()

const Linear = (a: float, b: float, t: float): float => a-a*t+b*t

//My version of what ever "https://easings.net/" is offering

const c: float = 2.59491
const InOutBack = (n: float): float => n<.5 && 2*n*n*(-c+2*n+2*c*n) || 3*(-1+n)*(-1+n)*(-2-c+2*n+2*c*n)

const [n1,d1]: [float, float] = [7.5625, 2.75]
const OutBounce = (n: float): float => (n<0.363636 && n*n*n1 ||
		n<0.727273 && (.75*(1.*d1-2.*n*n1)) ||
		n<0.909091 && (.9375*(1.*d1-2.4*n*n1)/d1)) || (.984375*(1.*d1-2.66667*n*n1))/d1

const OutQuad = (n: float): float => 2*n-n*n

export {
	Deg,
	RandArbitrary,
	Linear,
	InOutBack,
	OutBounce,
	OutQuad
}