
    /**
     * Główna funkcja przetwarzania pliku DOCX:
     * - 1. próbuje parsować z blobu
     * - 2. jeśli nieczytelny, konwertuje do Google Docs
     * - 3. jeśli dalej nieczytelny, wykonuje OCR
     * 
     * @param {File} file - plik DOCX
     * @returns {string} - finalny tekst z dokumentu (parsowany lub OCR)
     */
    function parseDocxWithFallback(file) {  // OK
      Logger.log(`📄 Start przetwarzania DOCX: ${file.getName()}`);
    
      // 1. 🔁 Konwersja do Google Docs
      const convertedText = convertDocxToGoogleDocText(file);
      if (convertedText && isValidExtractedText(convertedText)) {
        Logger.log(`✅ Parsowanie z Google Docs zakończone sukcesem`);
        return convertedText;
      }
  
      // 2. 🧠 OCR jako ostatnia deska ratunku
      Logger.log(`🔁 Parsowanie nieudane — fallback do OCR (jak dla PDF)`);
      return doOCRPDF(file);
    }
  
    /**
     * Konwertuje DOCX do Google Docs i wyciąga tekst
     */
    function convertDocxToGoogleDocText(file) {  // OK
      var resource = {
        title: file.getName().replace(/\.docx$/i, ''),
        mimeType: 'application/vnd.google-apps.document'
      };
  
      try {
        var gdoc = Drive.Files.insert(resource, file.getBlob());
        var docId = gdoc.id;
        Logger.log(`⏳ Skonwertowano DOCX: ${file.getName()} -> ${docId}`);
  
        var text = waitForDocumentReady(docId, 6, 800);
  
        DriveApp.getFileById(docId).setTrashed(true);
  
        if (!isValidExtractedText(text)) {
          Logger.log(`⚠️ Tekst z Google Docs uznany za nieczytelny`);
          return null;
        }
  
        return text;
  
      } catch (e) {
        Logger.log(`❌ Błąd konwersji DOCX: ${e.message}`);
        return null;
      }
    }
   
  