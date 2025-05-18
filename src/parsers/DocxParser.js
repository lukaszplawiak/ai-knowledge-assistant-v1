
    /**
     * Główna funkcja przetwarzania pliku DOCX:
     * - 1. próbuje parsować z blobu
     * - 2. jeśli nieczytelny, konwertuje do Google Docs
     * - 3. jeśli dalej nieczytelny, wykonuje OCR
     * 
     * @param {File} file - plik DOCX
     * @returns {string} - finalny tekst z dokumentu (parsowany lub OCR)
     */
    function parseDocxWithFallback(file) {
      Logger.log(`📄 Start przetwarzania DOCX: ${file.getName()}`);
  
      // 1. 🔍 Parsowanie bezpośrednie z blobu
      const directText = tryParseDocx(file);
      if (isValidExtractedText(directText)) {
        Logger.log(`✅ Parsowanie DOCX z blobu zakończone sukcesem`);
        return directText;
      }
  
      // 2. 🔁 Konwersja do Google Docs
      const convertedText = convertDocxToGoogleDocText(file);
      if (convertedText && isValidExtractedText(convertedText)) {
        Logger.log(`✅ Parsowanie z Google Docs zakończone sukcesem`);
        return convertedText;
      }
  
      // 3. 🧠 OCR jako ostatnia deska ratunku
      Logger.log(`🔁 Parsowanie nieudane — fallback do OCR (jak dla PDF)`);
      return doOCRPDF(file);
    }
  
    /**
     * Parsuje DOCX bezpośrednio z blobu
     */
    function tryParseDocx(file) {
      try {
        return file.getBlob().getDataAsString();
      } catch (e) {
        Logger.log(`❌ Błąd parsowania DOCX z blobu: ${e.message}`);
        return '';
      }
    }
  
    /**
     * Konwertuje DOCX → Google Docs i wyciąga tekst
     */
    function convertDocxToGoogleDocText(file) {
      const resource = {
        title: file.getName().replace(/\.docx$/i, ''),
        mimeType: MimeType.GOOGLE_DOCS
      };
  
      try {
        const gdoc = Drive.Files.insert(resource, file.getBlob());
        const docId = gdoc.id;
  
        Logger.log(`⏳ Konwersja DOCX → Google Docs: ${file.getName()} (${docId})`);
  
        const text = waitForDocumentReady(docId, 6, 800);
        DriveApp.getFileById(docId).setTrashed(true);
  
        if (!isValidExtractedText(text)) {
          Logger.log(`⚠️ Tekst z Google Docs nieczytelny`);
          return null;
        }
  
        // 💾 Zapis do .txt
        const parentFolder = getParentFolderSafe(file);
        if (parentFolder) {
          const blob = Utilities.newBlob(text, 'text/plain', file.getName().replace(/\.docx$/, '') + '.txt');
          parentFolder.createFile(blob);
          Logger.log(`✅ Utworzono plik .txt z Google Docs`);
        }
  
        return text;
  
      } catch (e) {
        Logger.log(`❌ Błąd konwersji DOCX: ${e.message}`);
        return null;
      }
    }
  