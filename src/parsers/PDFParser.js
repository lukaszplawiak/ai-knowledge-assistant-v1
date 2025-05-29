
    /**
     * Główna funkcja przetwarzania PDF:
     * - 1. próba parsowania z blobu (szybka)
     * - 2. jeśli nieskuteczna → OCR
     * 
     * @param {File} file - plik PDF
     * @returns {string} - tekst z dokumentu
     */
    function parsePdfWithFallback(file) {  // OK
      Logger.log(`📄 Start przetwarzania PDF: ${file.getName()}`);
  
      const parsedText = tryParsePdf(file);
  
      if (isValidExtractedText(parsedText)) {
        Logger.log(`✅ Parsowanie PDF zakończone sukcesem`);
        return parsedText;
      }
  
      Logger.log(`🔁 Parsowanie PDF zawiodło — fallback do OCR`);
      return doOCRImage(file);
    }
  
    /**
     * Parsuje PDF z blobu — tylko jeśli zawiera tekst
     * (Nie działa na PDF zeskanowanych jako obrazy)
     * 
     * @param {File} file 
     * @returns {string}
     */
    function tryParsePdf(file) {
      try {
        const text = file.getBlob().getDataAsString();
        Logger.log(`ℹ️ Wyciągnięto ${text.length} znaków z PDF`);
        return text;
      } catch (e) {
        Logger.log(`❌ Błąd parsowania PDF: ${e.message}`);
        return '';
      }
    }
  