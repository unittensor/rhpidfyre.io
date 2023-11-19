import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js"

type GLTFPath = string

const GLTF_Constructor = new GLTFLoader() 
const Load_GLTF = async (GLTF_FILE: GLTFPath): Promise<GLTF> => {
	//@ts-ignore
	return new Promise((resolve, _) => GLTF_Constructor.load(GLTF_FILE, (gltf_obj) => {
		resolve(gltf_obj)
	})).catch((reason: string) => console.error(reason))
}

interface CachedGLTFs {
	rhpidfyreio: Promise<GLTF> | null
}

const Cached: CachedGLTFs = {
	rhpidfyreio: null
}
const GetGLTF = async (GLTF_Name: string): Promise<GLTF> => {
	if (Cached[GLTF_Name] == null) {
		Cached[GLTF_Name] = await Load_GLTF(`/models/${GLTF_Name}.gltf`)
	}
	return Cached[GLTF_Name]
}

const CreateGLTF = {
	rhpidfyreio: (): Promise<GLTF> => GetGLTF("rhpidfyre3D")
}

export default CreateGLTF