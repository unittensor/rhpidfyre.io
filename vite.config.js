import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import { ViteEjsPlugin } from 'vite-plugin-ejs'

import fs from "fs"
import path from "path"

const html_dir = path.join(__dirname, "src", "html")

function inlineHtml(html_file_name) {
	try {
		const html_path = path.resolve(path.join(html_dir, html_file_name+".html"))
		return fs.readFileSync(html_path, "utf-8")
	} catch(read_err) {
		return "[INLINE-ERROR], "+read_err
	}
}

export default defineConfig({
	plugins: [
		createHtmlPlugin({minify: true}),
		ViteEjsPlugin({
			inlineHtml: inlineHtml
		})
	],
	root: "src",
	build: {
		outDir: "../dist"
	}
})