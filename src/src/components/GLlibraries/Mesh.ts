import { BoxGeometry, MeshBasicMaterial, Mesh, MeshPhongMaterial } from "three"
import type {float, xint, i8} from "../../@types/numbers"
import CreateGLTF from "./GLTF"
import WebGL from "../vue-home/HomeWebGL"

type GLCube = InstanceType<typeof Mesh>
type Hexadecimal = xint<i8>
type VertexVector = float[]

const MeshInstance = {
	Cube: (Vertices: VertexVector, MaterialColor: Hexadecimal): GLCube => {
		const Geometry = new BoxGeometry(...Vertices)
		const Material = new MeshBasicMaterial({color: MaterialColor})
		return new Mesh(Geometry, Material)
	},

	rhpidfyreio_text_3D: () => {
		const rhpidfyreio = CreateGLTF.rhpidfyreio()
		rhpidfyreio.then((decompiled_gltf) => {
			const gltfMesh = decompiled_gltf.scene
			const Camera = WebGL.Camera.position

			gltfMesh.material = new MeshPhongMaterial({color: 0xfffff})

			gltfMesh.rotation.x = 1.5708 //N[90 Degree, 5]
			gltfMesh.position.set(Camera.x-2.2, Camera.y, Camera.z-3)

			WebGL.Scene.add(gltfMesh)
		}).catch((reason: string) => console.warn(reason))
	}
}

export default MeshInstance