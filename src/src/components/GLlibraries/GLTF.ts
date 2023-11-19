import type { Mesh } from "three"
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js"

type GLTFPath = string

const GLTF_Constructor = new GLTFLoader() 
const Load_GLTF = async (GLTF_FILE: GLTFPath): Promise<GLTF> => {
	//@ts-ignore
	return new Promise((resolve, _) => GLTF_Constructor.load(GLTF_FILE, (gltf_obj) => {
		resolve(gltf_obj)
	})).catch((reason: string) => console.error(reason))
}

export interface GLTFModels {
	rhpidfyreio: Mesh | null
}

const Cached: GLTFModels = {
	rhpidfyreio: null
}
//@ts-ignore
const GetGLTF = async (GLTF_Name: string): Mesh => {
	if (Cached[GLTF_Name] == null) {
		await Load_GLTF(`/models/${GLTF_Name}.gltf`).then((GLTF: GLTF) => {
			GLTF.scene.traverse((GLTF_Mesh: Mesh) => {
				if (GLTF_Mesh.isMesh) {
					Cached[GLTF_Name] = GLTF_Mesh
				}
			})
		}).catch((reason: string) => console.warn(reason))
	}
	return Cached[GLTF_Name]
}

const CreateGLTF = {
	rhpidfyreio: (): Mesh => GetGLTF("rhpidfyre3D")
}

export default CreateGLTF