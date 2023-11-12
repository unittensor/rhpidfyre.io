type float = number
type ufloat = number
type int = number
type uint = number
type xfloat<xtype> = float
type xint<xtype> = int
type u_xfloat<xtype> = ufloat
type u_xint<xtype> = uint

type u8 = number
type i8 = number
type f8 = number
type u16 = number
type i16 = number
type f16 = number
type u32 = number
type i32 = number
type f32 = number
type u64 = number
type i64 = number
type f64 = number

export {
	float, ufloat,
	int, uint,
	xfloat, u_xfloat,
	xint, u_xint,
	u8, i8, f8,
	u16, i16, f16,
	u32, i32, f32,
	u64, i64, f64,
}