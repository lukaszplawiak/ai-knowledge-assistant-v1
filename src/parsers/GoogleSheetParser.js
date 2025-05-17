  // src/parsers/GoogleSheetParser.js
const GoogleSheetParser = (() => {
  const { extractSheetText } = SheetUtils;

  /**
   * Parsuje plik Google Sheets i wyciąga tekst z wszystkich arkuszy.
   */
  function parseGoogleSheetSafe(file) {
    try {
      const spreadsheet = SpreadsheetApp.open(file);
      const text = extractSheetText(spreadsheet);

      if (!text || text.trim().length === 0) {
        Logger.log(`⚠️ parseGoogleSheetSafe: pusty wynik z arkusza`);
        return '';
      }

      return text;
    } catch (e) {
      Logger.log(`❌ Błąd otwierania Google Sheet: ${e.message}`);
      return '';
    }
  }

  return {
    parseGoogleSheetSafe
  };
})();

  // /**
  //    * Parsowanie pliku Google Sheets
  //    */
  // function parseGoogleSheet(file) {
  //   try {
  //     const sheet = SpreadsheetApp.open(file);
  //     return extractSheetText(sheet);
  //   } catch (e) {
  //     Logger.log(`❌ Błąd parsowania Google Sheet: ${e.message}`);
  //     return '';
  //   }
  // }

  // /**
  //    * Wyodrębnia tekst z arkusza kalkulacyjnego (dowolnego typu)
  //    */
  // function extractSheetText(sheet) {
  //   const sheets = sheet.getSheets();
  //   return sheets.map(s => {
  //     const data = s.getDataRange().getValues();
  //     return data.map(row => row.join(' ')).join('\n');
  //   }).join('\n');
  // }