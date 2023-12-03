import {
    MeshNormalMaterial,
	type Mesh as Msh,
} from "three"
import type { GLTFModels } from "./GLTF"
import CreateGLTF from "./GLTF"

const MeshInstance = class {
	public static Instances: GLTFModels = {
        rhpidfyreio: null,
        LaTeX_Sum: null,
        LaTeX_delta: null
    }

	public static async rhpidfyreio_compile(): Promise<Msh> {
		MeshInstance.Instances.rhpidfyreio = await CreateGLTF("rhpidfyre3D")
		const rhpidfyreio = MeshInstance.Instances.rhpidfyreio

		rhpidfyreio.material = new MeshNormalMaterial()
		
		return rhpidfyreio
	}

	public static async LaTeX_Sum_compile(): Promise<Msh> {
		MeshInstance.Instances.LaTeX_Sum = await CreateGLTF("LaTeX_Sum")
		const LaTeXSum_Mesh = MeshInstance.Instances.LaTeX_Sum

		LaTeXSum_Mesh.material = new MeshNormalMaterial()

		return LaTeXSum_Mesh
	}
}

export default MeshInstance