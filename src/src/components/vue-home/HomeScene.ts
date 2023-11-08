import * as THREE from "three"

const MountWebGL = (WebGL_Context: HTMLElement): void => {
	const Renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	})
	const Scene = new THREE.Scene()
	const Camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, .1, 1000)

	const Grid = new THREE.GridHelper(50,50,0xffffff)
	const Clock = new THREE.Clock()

	Camera.position.y=2
	Camera.position.z=5
	Scene.add(Grid)

	Renderer.setAnimationLoop((elapse: number) => {
		const dt = Clock.getDelta()
		const QuatC=Math.cos(elapse/10000)
		Camera.quaternion.set(
			0,
			-QuatC/5,
			0,
			QuatC
		)
		Renderer.render(Scene, Camera)
	})

	window.addEventListener("resize", () => {
		Camera.aspect = window.innerWidth/window.innerHeight
		Camera.updateProjectionMatrix()
		Renderer.setSize(window.innerWidth, window.innerHeight)
	})
	Renderer.setPixelRatio(window.devicePixelRatio)
	Renderer.setSize(window.innerWidth, window.innerHeight)
	WebGL_Context.appendChild(Renderer.domElement)
}

export default MountWebGL