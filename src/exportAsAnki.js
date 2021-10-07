const saveAs = require('file-saver');
const AnkiExport = require('anki-apkg-export').default;

function exportAsAnki() {
    const keys = GM_listValues().map(key => key.trim())

    const deckName = `JishoDeck${new Date().toISOString().substr(0, 19)}`

    const template = {
        questionFormat: '{{kanji:Front}}',
        answerFormat: '{{furigana:Front}}\n\n<hr id="answer">\n\n{{Back}}',
        css: `
        *,
        *:before,
        *:after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        }

        .sentences {
        color: #666;
        }

        .meaning-tags {
        color: #888;
        font-size: 0.8em;
        margin-top: 10px;
        }

        .meaning-definition {
        font-size: 1.3em;
        }

        li {
        display: inline-block;
        font-size: 1.2em;
        }

        .furigana {
        display: block;
        min-height: 1.15em;
        font-size: 0.6em;
        }

        .card {
        display: flex;
        justify-content: center;
        font-size: 30px;
        text-align: center;
        }

        .meanings-wrapper {
        text-align: left;
        }

        .meaning-wrapper {
        margin-bottom: 2em;
        }

        .meaning-tags, .meaning-wrapper {
        font-size: 0.5em
        }

        .supplemental_info {
        margin-left: 0.7em;
        font-size: 0.68em;
        color: #888;
        }

        .english {
        display: block;
        }
    `}
    const apkg = new AnkiExport(deckName, template);

    for (let key of keys) {
        const value = GM_getValue(key)
        const dummyElement = document.createElement('html')
        dummyElement.innerHTML = value
        const furiganaSpans = dummyElement.querySelectorAll('.concept_light-representation .furigana > span')
        const furigana = [...furiganaSpans].map(node => node.textContent)
        const meanings = dummyElement.querySelector('.meanings-wrapper').outerHTML
        const front = getAnkiFuriganaString(key, furigana)
        apkg.addCard(front, meanings);
    }

    apkg.save()
        .then(zip => {
            saveAs(zip, `${deckName}.apkg`);
        })
        .catch(err => console.err(err.stack || err));
}

function getAnkiFuriganaString(text, furiganaArr) {
    const arrLength = text.length <= furiganaArr.length ? text.length : furiganaArr.length
    let finalString = ''
    for (let i = 0; i < arrLength; i++) {
        finalString = finalString.concat(`${text[i]}${furiganaArr[i] ? `[${furiganaArr[i]}]` : ''}`)
    }
    return finalString
}

module.exports = exportAsAnki