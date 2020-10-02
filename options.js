var filters

document.getElementById("buttonAddFilter").addEventListener("click", addFilter)
document.getElementById("radioPhrase").addEventListener("click", toggleFlagsInput)
document.getElementById("radioRegexp").addEventListener("click", toggleFlagsInput)

document.querySelectorAll("#tabsNav a").forEach(evement => evement.addEventListener("click", toggleTabs))

chrome.storage.local.get(["filters"], result => {
	filters = convertFilters(result.filters)
	console.log(filters)
	document.getElementById("fieldsetFilter").removeAttribute("disabled")
	displayFilters()
})

function addFilter(event) {
	event.preventDefault()

	let filter = { flags: "i" }
	let inputFilter = document.getElementById("inputFilter")

	if (inputFilter.value === "") return

	if (document.getElementById("radioRegexp").checked) {
		let inputFlags = document.getElementById("inputFlags")
		filter.string = inputFilter.value
		filter.flags = inputFlags.value
		filter.display = "/" + inputFilter.value + "/" + filter.flags
		inputFlags.value = ""
	} else {
		filter.string = escapeRegexp(inputFilter.value)
		filter.display = '"' + inputFilter.value + '"'
	}

	inputFilter.value = ""
	filters.patterns.push(filter)
	chrome.storage.local.set({ filters })
	displayFilters()
}

function deleteFilter(index) {
	if (!window.confirm("Удалить фильтр " + filters.patterns[index].display + " ?")) return
	filters.patterns.splice(index, 1)
	chrome.storage.local.set({ filters })
	displayFilters()
}

function displayFilters() {
	let filtersListNew = document.createElement("ul")
	filtersListNew.id = "filtersList"
	filtersListNew.className = "list-group list-group-flush"

	filters.patterns.forEach((filter, index) => {
		let deleteButton = document.createElement("button")
		deleteButton.className = "btn btn-danger btn-sm float-right"
		deleteButton.addEventListener("click", () => deleteFilter(index))
		deleteButton.append("Удалить")

		let filterText = document.createElement("span")
		filterText.className = "align-text-top"
		filterText.append(filter.display)

		let listItem = document.createElement("li")
		listItem.className = "list-group-item"
		listItem.append(filterText, deleteButton)

		filtersListNew.appendChild(listItem)
	})

	let filtersList = document.getElementById("filtersList")
	filtersList.parentNode.replaceChild(filtersListNew, filtersList)
}

function toggleFlagsInput(event) {
	let inputFlags = document.getElementById("inputFlags")
	let inputFilter = document.getElementById("inputFilter")

	if (event.target.value === "regexp") {
		inputFlags.classList.remove("d-none")
		inputFlags.classList.add("d-inline-block")
		setTimeout(() => {
			let width = inputFlags.parentElement.offsetWidth - inputFlags.offsetWidth - 5
			inputFilter.setAttribute("style", "width: " + width + "px!important;")
		}, 30)
	} else {
		inputFlags.classList.remove("d-inline-block")
		inputFlags.classList.add("d-none")
		inputFilter.removeAttribute("style")
	}
}

function toggleTabs(event) {
	event.preventDefault()
	let tab = event.target

	document.querySelectorAll("[role=tab]").forEach(t => t.classList.remove("active"))
	document.querySelectorAll("[role=tabpanel]").forEach(t => t.classList.remove("active", "show"))
	document.getElementById(tab.dataset.target).classList.add("active", "show")
	tab.classList.add("active")
}

function escapeRegexp(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}
// TEMP
function convertFilters(input) {
	let output = { patterns: [], threads: {} }
	if (!input) {
		return output
	} else if (Array.isArray(input)) {
		output.patterns = input
		return output
	} else {
		return input
	}
}
