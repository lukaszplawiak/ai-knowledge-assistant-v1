
    function parseExcelSafe(file) {  // OK
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
 