import { cyan, green } from "../shell/color"

import librfwfs, { username } from "../rfwfs/library"
import create from "./create"

interface Ps1Prompt {
	readonly body: HTMLDivElement,
	readonly input: HTMLInputElement
}
interface Inputs {
	old?: HTMLInputElement,
	new?: HTMLInputElement
}
let inputs: Inputs = {
	old: undefined,
	new: undefined
}

function browser_name_via_useragent(): string {
	const userAgent = navigator.userAgent
	const browser_name_fallible = userAgent.match(/Firefox.\d+[\d.\d]+|Chrome.\d+[\d.\d]+/gm)?.map(f => f.split("/")[0])

	if (browser_name_fallible) {
		const useragent_name = browser_name_fallible[0]
		if (useragent_name === "Firefox") {
			return "gecko"
		} else if (useragent_name === "Chrome") {
			return "chromium"
		}/* else if (useragent_name === "AppleWebKit") {
			return "safari"
		} */
	}
	return "unknown"
}

const browser_name = browser_name_via_useragent()
function ps1_element(user: HTMLSpanElement, dir: HTMLSpanElement) {
	const display = create("p")
	display.appendChild(user)
	display.append(`@${browser_name}`)
	display.appendChild(dir)
	display.append("> ")
	return display
}

function working_dir_name() {
	const dir = librfwfs.home.dir()
	if (dir) {
		const dir_name = dir.name.read()
		if (dir_name) {
			return dir_name === username ? "~" : dir_name
		}
	}
	return "?"
}

function working_dir_element() {
	const user = cyan("user")
	const dir = green(" "+working_dir_name())
	return ps1_element(user, dir)
}

export default function prompt(): Ps1Prompt {
	const prompt_div = create("div", "shell-prompt")
	const ps1 = working_dir_element()
	const input = create("input", "shell-ps1")
	input.type = "text"
	input.spellcheck = false

	inputs.old = inputs.new
	if (inputs.old) {
		inputs.old.disabled = true
	}
	inputs.new = input

	prompt_div.appendChild(ps1)
	prompt_div.appendChild(input)

	return {
		body: prompt_div,
		input: input
	}
}