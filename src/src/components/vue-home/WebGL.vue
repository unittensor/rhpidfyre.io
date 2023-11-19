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
	import WebGL from "./HomeWebGL"

	export default {
		mounted() {
			const Context = new WebGL(this.$el)
			Context.Mount()
		}
	}
</script>