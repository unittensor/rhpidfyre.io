import {
	BoxGeometry,
	Mesh,
    MeshBasicMaterial,
    MeshNormalMaterial,
	type Mesh as Msh,
} from "three"
import type {float, xint, i8} from "../../@types/numbers"
import type { GLTFModels } from "./GLTF"
import CreateGLTF from "./GLTF"
import WebGL from "../vue-home/HomeWebGL"

type GLCube = InstanceType<typeof Mesh>
type Hexadecimal = xint<i8>
type VertexVector = float[]

const MeshInstance = class {
	public static Instances: GLTFModels = {
        rhpidfyreio: null
    }

	public static Cube(Vertices: VertexVector, MaterialColor: Hexadecimal): GLCube {
		const Geometry = new BoxGeometry(...Vertices)
		const Material = new MeshBasicMaterial({color: MaterialColor})
		return new Mesh(Geometry, Material)
	}

	public static async rhpidfyreio_compile(): Promise<Msh> {
		MeshInstance.Instances.rhpidfyreio = await CreateGLTF.rhpidfyreio()
		const rhpidfyreio = MeshInstance.Instances.rhpidfyreio
		const Camera = WebGL.Camera.position

		rhpidfyreio.material = new MeshNormalMaterial()
		rhpidfyreio.rotation.x = 1.5708 //N[90 Degree, 5]
		rhpidfyreio.position.set(Camera.x-2.2, Camera.y, Camera.z-3)
		
		return rhpidfyreio
	}
}

export default MeshInstance