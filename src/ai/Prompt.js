/**
 * Buduje prompt do ChatGPT na podstawie tekstu i szablonu metadata.json.
 * @param {string} text - Treść pliku .txt do analizy.
 * @returns {string} - Gotowy prompt do wysłania do API.
 */
function buildMetadataPrompt(text) {
    return `
  Wygeneruj poniższy plik metadata.json na podstawie przekazanego tekstu.
  Uzupełnij każde pole najlepiej jak potrafisz, zgodnie ze strukturą - jeśli nie znajdziesz danych, zostaw puste pole.
  
  Oto szablon JSON (nie zmieniaj struktury!):
  
  {
    "fileName": "",
    "fileType": "",
    "documentType": "",
    "project": {
      "projectName": "",
      "location": "",
      "date": "",
      "stage": ""
    },
    "document": {
      "title": "",
      "sections": [],
      "authors": [],
      "createdDate": "",
      "modifiedDate": ""
    },
    "communication": {
      "participants": [],
      "conversationDate": "",
      "topic": "",
      "conclusions": ""
    },
    "textData": {
      "rawText": "",
      "summary": "",
      "keywords": [],
      "keywordSynonyms": {},
      "language": ""
    },
    "excelData": {
      "numberOfSheets": 0,
      "sheetNames": [],
      "approximateRows": 0,
      "importantFields": [],
      "sampleRows": [],
      "textualSheets": []
    },
    "meta": {
      "source": "",
      "ocrConfidence": 0.0,
      "textLength": 0,
      "generatedAt": "",
      "documentHash": "",
      "metadataVersion": "1.0",
      "tags": []
    }
  }
  
  Oto tekst do analizy:
  ---
  ${text}
  ---
  Zasady:
  - Znajdź 5 słów kluczowych ("keywords") oraz 3 synonimy do każdego.
  - Jeśli nie możesz znaleźć jakiejś informacji, wpisz pusty string/array (ale nie zmieniaj nazwy pola!).
  - Odpowiedz **tylko** poprawnym, parsowalnym JSON-em.
    `;
  }
  