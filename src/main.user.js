const saveAs = require('file-saver');
const AnkiExport = require('anki-apkg-export').default;

function createVocabLink() {
    const link = document.getElementsByClassName("links")[0]
    const vocabLinkListItem = document.createElement("li")
    const vocabLink = document.createElement("a")
    vocabLink.textContent = "Vocabulary"
    vocabLinkListItem.append(vocabLink)
    link.prepend(vocabLinkListItem)
    let vocabHidden = true
    let pageContent = undefined
    vocabLink.addEventListener("click", () => {
        const pageContainer = document.getElementById("page_container")
        if(vocabHidden) {
            pageContent = pageContainer.innerHTML
            pageContainer.innerHTML = ""
            showVocabulary()
        } else {
            pageContainer.innerHTML = pageContent
            connectSaveLinks()
        }
        vocabHidden = !vocabHidden
    })
}

function showVocabulary() {
    const pageContainer = document.getElementById("page_container")
    let innerHtml = ""
    const frag = document.createElement("div")
    GM_listValues().reduceRight((_, word) => {
        const wordHtml = GM_getValue(word)
        innerHtml += wordHtml
    }, null)
    frag.innerHTML = innerHtml
    hideMeanings(frag)
    pageContainer.innerHTML = frag.innerHTML
    replaceSaveLinks(pageContainer)
    setupWordClick(pageContainer)
    blurFurigana(pageContainer)
    createClearVocabLink(pageContainer)
    createExportLink(pageContainer)
    pageContainer.insertAdjacentHTML("afterbegin", "<h4 style='font-weight: bold'>Vocabulary</h4>")
}

function createExportLink(elem) {
    const exportLink = document.createElement("div")
    exportLink.innerHTML = "<a>Export as Anki deck</a>"
    elem.append(exportLink)
    exportLink.addEventListener("click", () => {
        exportAsAnki()
    })
}

function exportAsAnki() {
    const keys = GM_listValues().map(key => key.trim())

    const deckName = `JishoDeck${new Date().toISOString().substr(0,19)}`
    
    const apkg = new AnkiExport(deckName);
    
    for(let key of keys) {
        const value = GM_getValue(key)
        const dummyElement = document.createElement('html')
        dummyElement.innerHTML = value
        const meanings = dummyElement.querySelector(".meanings-wrapper").outerHTML
        apkg.addCard(key, meanings);
    }

    apkg
    .save()
    .then(zip => {
        saveAs(zip, `${deckName}.apkg`);
    })
    .catch(err => console.log(err.stack || err));
}

function createClearVocabLink(elem) {
    const clearVocabLink = document.createElement("div")
    clearVocabLink.innerHTML = "<a>Clear vocabulary</a>"
    elem.append(clearVocabLink)
    clearVocabLink.addEventListener("click", () => {
        if(confirm("Are you sure?")) {
            clearVocab()
        }
    })
}

function blurFurigana(elem) {
    const furiganas = elem.querySelectorAll(".furigana")
    furiganas.forEach(furigana => {
        furigana.style.filter = "blur(5px)"
        furigana.addEventListener("mouseenter", () => {
            furigana.style.filter = ""
        })
        furigana.addEventListener("mouseleave", () => {
            furigana.style.filter = "blur(5px)"
        })
    })
}

function setupWordClick(elem) {
    const words = elem.querySelectorAll(".text")
    words.forEach(word => {
        word.style.cursor = "pointer"
        word.addEventListener("click", () => {
            const wordDiv = getWordDiv(word)
            const meanings = wordDiv.querySelectorAll(".concept_light-status, .concept_light-meanings")
            meanings.forEach(meaning => {
                if(meaning.style.display === "none") {
                    meaning.style.display = ""
                } else {
                    meaning.style.display = "none"
                }
            })
        })
    })
}

function hideMeanings(elem) {
    const meanings = elem.querySelectorAll(".concept_light-status, .concept_light-meanings")
    meanings.forEach(meaning => {
        meaning.style.display = "none"
    })
}

function getWordFromSaveLink(link) {
    const wordDiv = getWordDiv(link)
    return wordDiv.querySelector(".text").textContent.trim()
}

//Replaces save word links with remove word links when in vocabulary
function replaceSaveLinks(elem) {
    const saveLinks = elem.querySelectorAll(".save_link")
    saveLinks.forEach(saveLink => {
        saveLink.textContent = "Remove word"
        saveLink.addEventListener("click", () => {
            const wordText = getWordFromSaveLink(saveLink)
            GM_deleteValue(wordText)
            showVocabulary()
        })
    })
}

//Reconnects save links when returning from vocabulary
function connectSaveLinks() {
    const saveLinks = document.querySelectorAll(".save_link")
    for(let saveWordLink of saveLinks) {
        saveWordLink.addEventListener("click", () => {
            const wordDiv = getWordDiv(saveWordLink)
            const wordText = getWordFromSaveLink(saveWordLink)
            GM_setValue(wordText, wordDiv.outerHTML)
        })
    }
}

function getWordDiv(elem) {
    let current = elem.parentElement
    while(!current.classList.contains("clearfix")) {
        current = current.parentElement
    }
    return current
}

function createSaveButtons() {
    const wordWrappers = document.querySelectorAll(".concept_light-status")
    for(let status of wordWrappers) {
        const saveWordLink = document.createElement("a")
        saveWordLink.classList.add("concept_light-status_link")
        saveWordLink.classList.add("save_link")
        saveWordLink.textContent = "Save word"
        status.append(saveWordLink)
    }
    connectSaveLinks()
}

function clearVocab() {
    GM_listValues().forEach(name => {
        GM_deleteValue(name)
    })
    showVocabulary()
}

(function main() {
    'use strict'
    createVocabLink()
    createSaveButtons()
})()
