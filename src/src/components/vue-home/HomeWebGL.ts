import * as THREE from "three"
import MeshInstance from "../GLlibraries/Mesh"
import type { float, int } from "../../@types/numbers"

const Renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
})
const Scene = new THREE.Scene()
const Camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, .1, 1000)
Camera.position.set(0,5,15)

const Tesseract = MeshInstance.Tesseract(0x7500ff)

Scene.add(Tesseract)

const WebGL = class {
	public static TickHz: int = 10_000
	public static RenderDistance: float = 4

	private WebGL_Context: HTMLElement

	constructor(WebGL_Context: HTMLElement, TickHz?: int, RenderDistance?: float) {
		this.WebGL_Context = WebGL_Context
		WebGL.TickHz = TickHz || WebGL.TickHz
		WebGL.RenderDistance = RenderDistance || WebGL.RenderDistance
	}

	public Mount(): void {
		Renderer.setAnimationLoop((elapse: float) => {
			const tick = elapse/WebGL.TickHz
			const cost = Math.cos(tick*3)
			const sint = Math.sin(tick*3)

			Camera.lookAt(Tesseract.position)
			// Camera.position.set(sint*WebGL.RenderDistance, 2, cost*WebGL.RenderDistance)
			Renderer.render(Scene, Camera)
		})

		window.addEventListener("resize", () => {
			Camera.aspect = window.innerWidth/window.innerHeight
			Camera.updateProjectionMatrix()
			Renderer.setSize(window.innerWidth, window.innerHeight)
		})
		Renderer.setPixelRatio(window.devicePixelRatio)
		Renderer.setSize(window.innerWidth, window.innerHeight)
		this.WebGL_Context.appendChild(Renderer.domElement)
	}
}

export default WebGL