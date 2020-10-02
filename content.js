var filters

chrome.storage.local.get(["filters"], result => {
	filters = convertFilters(result.filters)
	console.log(JSON.stringify(filters))
	applyFilters()
	cleanupFilters()
})

function applyFilters() {
	filters.patterns.forEach(pattern => {
		if ("string" in pattern && "flags" in pattern) pattern.regexp = RegExp(pattern.string, pattern.flags)
	})
	document.querySelectorAll(".bl-ml-m").forEach(msg => {
		let message = {
			id: msg.id,
			thread: msg.querySelector(".bl-ml-m-th")
		}
		// Highly likely message was deleted if there is no thread DOM element: skip it!
		if (!message.thread) return

		// Can't move this to message definition, reason: will throw if there is a deleted message on the page
		message.controls = msg.querySelector("ul.bl-btns")
		message.content = message.thread.parentElement
		let threadLink = message.thread.firstElementChild
		let threadId = threadLink.getAttribute("href").split("/").slice(2, 4).join("_")

		if (threadId in filters.threads) {
			addControlsItem(message, createButton("fg-btni-show-thread", event => onShowThread(event, threadId), { title: "Показывать тред" }))
			hideMessageContent(message, "Тред скрыт")
			return
		}
		addControlsItem(message, createButton("fg-btni-hide-thread", event => onHideThread(event, threadId), { title: "Скрывать тред" }))

		// Message text content
		let text = message.content.textContent
		for (let pattern of filters.patterns) {
			if ("regexp" in pattern && pattern.regexp.test(text)) {
				hideMessageContent(message, "Фильтр: " + pattern.display)
				return
				// let filterBoxId = message.id + "Filter";
				// Create button
				let buttonToggleMessage = document.createElement("span")
				// buttonToggleMessage.dataset.status = "hidden";
				buttonToggleMessage.innerHTML = "&nbsp"
				buttonToggleMessage.className = "fg-btn fg-btni-show-message"
				// buttonToggleMessage.setAttribute("title", "Показать сообщение");
				buttonToggleMessage.addEventListener("click", event => toggleMessage(event.target, message.id))
				// Create filter display indicator
				let filterDisplay = document.createElement("span")
				filterDisplay.setAttribute("style", "padding-right: 10px;")
				filterDisplay.append("Фильтр: " + pattern.display)
				// Add filter display and button to DOM
				let li = document.createElement("li")
				li.append(buttonToggleMessage)
				message.controls.prepend(li)
				li = document.createElement("li")
				li.append(filterDisplay)
				message.controls.prepend(li)
				// Hide message body
				// messageContent.parentElement.setAttribute("style", "display: none;");
				message.content.parentElement.classList.add("fg-hidden")
				return;
			}
		}
	})
}

function addControlsItem(message, element) {
	message.controls.prepend( createListItem(element) )
}

function cleanupFilters() {
	let now = Date.now()
	let modified = false
	for (let threadId in filters.threads)
		if (now > filters.threads[threadId].expiresAt) {
			modified = true
			delete filters.threads[threadId]
		}

	if (modified) saveFilters()
}

function createButton(buttonClass, clickCallback, attributes = {}) {
	let button = document.createElement("span")
	button.innerHTML = "&nbsp"
	button.className = "fg-btn " + buttonClass
	button.addEventListener("click", clickCallback)
	for (let key in attributes) button.setAttribute(key, attributes[key])
	return button
}

function createListItem(element) {
	let li = document.createElement("li")
	li.append(element)
	return li
}

function hideMessageContent(message, displayText) {
	let filterDisplay = document.createElement("span")
	filterDisplay.setAttribute("style", "padding-right: 10px;")
	filterDisplay.append(displayText)

	addControlsItem(message, createButton("fg-btn fg-btni-show-message", event => onToggleMessage(event.target, message.id)) )
	addControlsItem(message, filterDisplay)
	message.content.parentElement.classList.add("fg-hidden")
}

function onHideThread(event, threadId) {
	if (threadId in filters.threads) return
	filters.threads[threadId] = {expiresAt: Date.now() + 604800000}
	saveFilters()
	event.target.parentElement.remove()
}

function onShowThread(event, threadId) {
	if (!(threadId in filters.threads)) return
	delete filters.threads[threadId]
	saveFilters()
	event.target.parentElement.remove()
}

function onToggleMessage(button, messageId) {
	let messageBody = document.getElementById(messageId).querySelector(".bl-ml-m-th").parentElement.parentElement
	// messageBody.removeAttribute("style");
	messageBody.classList.toggle("fg-hidden")
	button.classList.toggle("fg-btni-show-message")
	button.classList.toggle("fg-btni-hide-message")
	// if (button.dataset.status === "hidden") {
	// 	messageBody.classList.remove("fg-hidden");
	// 	button.dataset.status = "shown";
	// } else {
	// 	messageBody.classList.add("fg-hidden");
	// 	button.dataset.status = "hidden";
	// }
}

function saveFilters() {
	chrome.storage.local.set({filters})
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
