const Linear = (a: number, b: number, t: number): number => a-a*t+b*t

const c: number = 2.59491
const InOutBack = (n: number): number => n<.5 && 2*n*n*(-c+2*n+2*c*n) || 3*(-1+n)*(-1+n)*(-2-c+2*n+2*c*n)

const [n1,d1]: [number, number] = [7.5625, 2.75]
const OutBounce = (n: number): number => (n<0.363636 && n*n*n1 ||
		n<0.727273 && (.75*(1.*d1-2.*n*n1)) ||
		n<0.909091 && (.9375*(1.*d1-2.4*n*n1)/d1)) || (.984375*(1.*d1-2.66667*n*n1))/d1

export {
	Linear,
	InOutBack,
	OutBounce,
}