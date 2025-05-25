
    /**
     * Parsowanie pliku PDF do tekstu (bez OCR)
     */
    function tryParseText(file) {  // OK
      try {
        return file.getBlob().getDataAsString();
      } catch (e) {
        Logger.log(`❌ Błąd parsowania PDF: ${e.message}`);
        return '';
      }
    }
  