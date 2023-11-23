import * as THREE from "three"
import MeshInstance from "../GLlibraries/Mesh"
import type { float, int } from "../../@types/numbers"
import type { WebGLRenderer, Scene, PerspectiveCamera } from "three"

const Vec3 = THREE.Vector3

const WebGL_Properties = class {
	//TODO: make these real properties
	public static TickHz: int = 5000
	public static RenderDistance: float = 4
	public static antialias: boolean = true

	public static Renderer?: WebGLRenderer = undefined
	public static Camera?: PerspectiveCamera = undefined
	public static Scene?: Scene = undefined
}

const WebGL = class extends WebGL_Properties {
	public WebGL_Context: HTMLElement

	constructor(WebGL_Context: HTMLElement, TickHz?: int, RenderDistance?: float) {
		super()
		this.WebGL_Context = WebGL_Context
		WebGL.TickHz = TickHz || WebGL.TickHz
		WebGL.RenderDistance = RenderDistance || WebGL.RenderDistance

		WebGL.Renderer = new THREE.WebGLRenderer({
			antialias: WebGL.antialias,
			alpha: true
		})
		WebGL.Scene = new THREE.Scene()
		WebGL.Camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, .1, 1000)
	}

	public Mount(): void {
		let rhpidfyreio_pos = new Vec3() //heh
		MeshInstance.rhpidfyreio_compile().then((gltfMesh: THREE.Mesh) => { //make better
			WebGL.Scene.add(gltfMesh)
			rhpidfyreio_pos = new Vec3(2.4,0,0).add(gltfMesh.position)
		})

		WebGL.Renderer.setAnimationLoop((elapse: float) => {
			const tick = elapse/WebGL.TickHz
			const sint = Math.sin(tick)

			WebGL.Camera.lookAt(rhpidfyreio_pos)
			WebGL.Camera.position.set(WebGL.RenderDistance+sint*2, WebGL.RenderDistance+sint/2, 0)
			
			WebGL.Renderer.render(WebGL.Scene, WebGL.Camera)
		})
		window.addEventListener("resize", () => {
			WebGL.Camera.aspect = window.innerWidth/window.innerHeight
			WebGL.Camera.updateProjectionMatrix()
			WebGL.Renderer.setSize(window.innerWidth, window.innerHeight)
		})
		WebGL.Renderer.setPixelRatio(window.devicePixelRatio)
		WebGL.Renderer.setSize(window.innerWidth, window.innerHeight)
		this.WebGL_Context.appendChild(WebGL.Renderer.domElement)
	}
}

export default WebGL