<template>
	<aside></aside>
</template>

<style lang="scss" scoped>
	aside {
		width: 100vw;
		height: 100vh;
		user-select: none;
		pointer-events: none;
		position: absolute;

		> canvas {
			user-select: inherit;
			pointer-events: inherit;
		}
	}
</style>

<script lang="ts">
	import MountWebGL from "./HomeScene"

	export default {
		mounted() {		
			MountWebGL(this.$el)
		}
	}
</script>