import {
    MeshNormalMaterial,
	type Mesh as Msh,
} from "three"
import type { GLTFModels } from "./GLTF"
import CreateGLTF from "./GLTF"

type GLTFModelName = string
type MeshInstances = {[x: string]: Promise<Msh>}

const Instances: GLTFModels = {
    rhpidfyreio: null
}

const GLTF_Model = async (Name: GLTFModelName): Promise<Msh> => {
	Instances[Name] = await CreateGLTF(Name)
	Instances[Name].material = new MeshNormalMaterial()
	return Instances[Name]
}

const MeshInstance: MeshInstances = {
	rhpidfyreio_compile: GLTF_Model("rhpidfyreio")
}

export default MeshInstance