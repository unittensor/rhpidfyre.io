import * as Easing from "./Easings"
import type { float, int } from "../../@types/numbers"

const Tween = class {
	private Delta: float;
	private Hz: float;

	constructor(Hz?: int) {
		this.Delta = 0
		this.Hz	= Hz ? Hz : 1000/10
	}

	public Play() {
		
	}
}

export default Tween