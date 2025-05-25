/**
 * Waliduje, czy przekazany obiekt spełnia wymaganą strukturę metadata.json.
 * Zwraca true/false i opcjonalnie loguje błędy.
 * @param {object} json - Sparsowany JSON z odpowiedzi AI.
 */
function validateMetadataJson(json) { // OK
  // Lista wymaganych pól głównych
  const requiredFields = [
    "fileName", "fileType",
    "project", "document", "textData"
  ];
  for (let field of requiredFields) {
    if (!(field in json)) {
      Logger.log(`❌ Brak pola głównego: ${field}`);
      return false;
    }
  }
  // Przykład: możesz dodać dodatkowe walidacje (np. typów, podstruktur, wymaganych pól wewnątrz)
  // Np. czy textData.keywords to array, czy meta.metadataVersion === '1.0', itp.
  // ...
  return true;
}


function cleanJsonFromAI(response) {  // OK
  // Usuwa ```json i ``` na początku/końcu oraz białe znaki
  return response
    .replace(/^\s*```json\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

