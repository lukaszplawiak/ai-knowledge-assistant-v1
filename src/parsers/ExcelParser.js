
    /**
     * Analizuje plik Excel i zwraca podstawowe informacje o jego zawartości.
     * 
     * @param {File} file - Plik XLSX (plik Google Drive typu binary).
     * @returns {Array<Object>} - Tablica z insightami dla każdego arkusza.
     */
    // function extractExcelInsights(file) {
    //   try {
    //     const spreadsheet = SpreadsheetApp.open(file);
    //     const sheets = spreadsheet.getSheets();
    //     const insights = [];
  
    //     for (const sheet of sheets) {
    //       const data = sheet.getDataRange().getValues();
    //       const preview = data.slice(0, 3); // Pierwsze 3 wiersze jako podgląd
    //       insights.push({
    //         name: sheet.getName(),
    //         rows: data.length,
    //         columns: data[0]?.length || 0,
    //         preview
    //       });
    //     }
  
    //     return insights;
  
    //   } catch (e) {
    //     Logger.log(`❌ Błąd podczas ekstrakcji Excela (${file.getName()}): ${e.message}`);
    //     return [];
    //   }
    // }
    function parseExcelSafe(file) {
      try {
        const blob = file.getBlob();
        const fileName = file.getName().replace(/\.[^.]+$/, '');
    
        // ⚠️ Google nie udostępnia oficjalnej metody konwersji XLSX -> Sheets poza Drive API v2
        // Wersja poniżej wykorzystuje tymczasowo Drive API v2
        const resource = {
          title: fileName,
          mimeType: 'application/vnd.google-apps.spreadsheet' // tak to wygląda w Drive API
        };
    
        const convertedFile = Drive.Files.insert(resource, blob);
        const spreadsheet = SpreadsheetApp.openById(convertedFile.id);
        const text = extractSheetText(spreadsheet);
    
        DriveApp.getFileById(convertedFile.id).setTrashed(true);
    
        if (!text || text.trim().length === 0) {
          Logger.log(`⚠️ parseExcelSafe: pusty tekst po konwersji XLSX -> Sheets`);
          return '';
        }
    
        return text;
    
      } catch (e) {
        Logger.log(`❌ parseExcelSafe: błąd konwersji: ${e.message}`);
        return '';
      }
    }
    
  // Gdzie i kiedy używać?
  // W Metadata.js, do uzupełnienia pola document.sections gdy plik jest typu excel.