
  /**
   * Parsuje plik Google Sheets i wyciąga tekst z wszystkich arkuszy.
   */
  function parseGoogleSheetSafe(file) {  // OK
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

  