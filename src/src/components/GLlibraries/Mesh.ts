import { BoxGeometry, MeshBasicMaterial, Mesh, BufferGeometry, BufferAttribute } from "three"
import type {float, xint, i8} from "../../@types/numbers"

type GL_Cube = InstanceType<typeof Mesh>
type GL_Tesseract = InstanceType<typeof Mesh>
type Hexadecimal = xint<i8>
type VertexVector = float[]

const MeshInstance = class {
	constructor() {}

	public static Cube(Vertices: VertexVector, MaterialColor: Hexadecimal): GL_Cube {
		const Geometry = new BoxGeometry(...Vertices)
		const Material = new MeshBasicMaterial({color: MaterialColor})
		return new Mesh(Geometry, Material)
	}

	public static Tesseract(MaterialColor: Hexadecimal): GL_Tesseract {
		const Vertices = new Float32Array([
			0, 0, 0,
			0, 0, 0,
			0, 0, 0,
			0, 0, 0,
			0, 0, 0,
			0, 0, 0,
			0, 0, 0,
			0, 0, 0,
		])
		const Indices = [
			0, 3, 2,
    		0, 1, 3,
    		1, 7, 3,
    		1, 5, 7,
    		5, 6, 7,
    		5, 4, 6,
    		4, 2, 6,
    		4, 0, 2,
    		2, 7, 6,
    		2, 3, 7,
    		4, 1, 0,
    		4, 5, 1
		]
		const Geometry = new BufferGeometry()
							.setAttribute("position", new BufferAttribute(Vertices, 3))
							.setIndex(Indices)
		const Material = new MeshBasicMaterial({color: MaterialColor})
		return new Mesh(Geometry, Material)
	}
}

export default MeshInstance