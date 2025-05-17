// src/core/Parsers.js
const Parsers = (() => {
    const { waitForDocumentReady, getParentFolderSafe, isValidExtractedText } = FileUtils;
  
    /**
     * Parsowanie pliku PDF do tekstu (bez OCR)
     */
    function tryParseText(file) {
      try {
        return file.getBlob().getDataAsString();
      } catch (e) {
        Logger.log(`❌ Błąd parsowania PDF: ${e.message}`);
        return '';
      }
    }
  
    /**
     * Parsowanie pliku DOCX (próba bez konwersji)
     */
    function tryParseDocx(file) {
      try {
        return file.getBlob().getDataAsString();
      } catch (e) {
        Logger.log(`❌ Błąd parsowania DOCX: ${e.message}`);
        return '';
      }
    }
  
    /**
     * Parsowanie pliku Google Sheets
     */
    function parseGoogleSheet(file) {
      try {
        const sheet = SpreadsheetApp.open(file);
        return extractSheetText(sheet);
      } catch (e) {
        Logger.log(`❌ Błąd parsowania Google Sheet: ${e.message}`);
        return '';
      }
    }

  
    /**
     * Parsowanie pliku XLSX poprzez konwersję do Google Sheets
     */
    function parseExcel(file) {
      try {
        const blob = file.getBlob();
        const resource = Drive.Files.insert({
          title: file.getName(),
          mimeType: MimeType.GOOGLE_SHEETS
        }, blob);
        const sheet = SpreadsheetApp.openById(resource.id);
        const text = extractSheetText(sheet);
        DriveApp.getFileById(resource.id).setTrashed(true);
        return text;
      } catch (e) {
        Logger.log(`❌ Błąd parsowania Excel: ${e.message}`);
        return '';
      }

// function parseExcel(file) {
    // try {
    //     const blob = file.getBlob();
    //     const resource = Drive.Files.insert(
    //       {
    //         title: file.getName(),
    //         mimeType: MimeType.GOOGLE_SHEETS
    //       },
    //       blob
    //     );
    
    //     const sheet = SpreadsheetApp.openById(resource.id);
    //     const sheets = sheet.getSheets();
    //     let allText = '';
    
    //     sheets.forEach(s => {
    //       const data = s.getDataRange().getValues();
    //       data.forEach(row => {
    //         allText += row.join(' ') + '\n';
    //       });
    //     });
    
    //     // Usuwamy tymczasowy Google Sheet
    //     DriveApp.getFileById(resource.id).setTrashed(true);
    
    //     return allText;
    
    //   } catch (e) {
    //     Logger.log(`❌ Błąd parsowania pliku Excel: ${e.message}`);
    //     return '';
    //   }
    // }



    }
  
    /**
     * Wyodrębnia tekst z arkusza kalkulacyjnego (dowolnego typu)
     */
    function extractSheetText(sheet) {
      const sheets = sheet.getSheets();
      return sheets.map(s => {
        const data = s.getDataRange().getValues();
        return data.map(row => row.join(' ')).join('\n');
      }).join('\n');
    }
  
    /**
     * Konwertuje DOCX do Google Docs i wyciąga tekst
     */
    function convertDocxToGoogleDocText(file) {
      const resource = {
        title: file.getName().replace(/\.docx$/i, ''),
        mimeType: 'application/vnd.google-apps.document'
      };
  
      try {
        const gdoc = Drive.Files.insert(resource, file.getBlob());
        const docId = gdoc.id;
        Logger.log(`⏳ Skonwertowano DOCX: ${file.getName()} -> ${docId}`);
  
        const text = waitForDocumentReady(docId, 6, 800);
  
        DriveApp.getFileById(docId).setTrashed(true);
  
        if (!isValidExtractedText(text)) {
          Logger.log(`⚠️ Tekst z Google Docs uznany za nieczytelny`);
          return null;
        }
  
        const parentFolder = getParentFolderSafe(file);
        if (parentFolder) {
          const blob = Utilities.newBlob(text, 'text/plain', file.getName().replace(/\.docx$/, '') + '.txt');
          parentFolder.createFile(blob);
        }
  
        return text;
  
      } catch (e) {
        Logger.log(`❌ Błąd konwersji DOCX: ${e.message}`);
        return null;
      }
    }
  
    return {
      tryParseText,
      tryParseDocx,
      parseGoogleSheet,
      parseExcel,
      convertDocxToGoogleDocText
    };
  })();
  