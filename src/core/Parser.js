/**
     * Główna funkcja przetwarzania pliku:
     * - wybiera odpowiedni parser/OCR w zależności od MIME typu
     * - fallbackuje jeśli potrzeba
     *
     * @param {File} file - plik wejściowy
     * @returns {string} - przetworzony tekst
     */
    function performParsingWithFallback(file) {  // OK
      const mimeType = file.getMimeType();
      const fileName = file.getName();
      let text = '';
  
      if (mimeType.includes('google-apps') && mimeType !== 'application/vnd.google-apps.spreadsheet') {
        Logger.log(`⚠️ Pomijam nieobsługiwany typ pliku: ${fileName} (${mimeType})`);
        return '';
      }
  
      try {
      
        if (/image\/(jpeg|jpg|png|tiff)/.test(mimeType)) {
          text = doOCRImage(file);
        } else if (mimeType === 'application/pdf') {
          text = parsePdfWithFallback(file);
  
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mimeType === 'application/msword' 
        ) {
          text = parseDocxWithFallback(file);
      
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          text = parseExcelSafe(file);
  
        } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
          text = parseGoogleSheetSafe(file);
  
        } else {
          Logger.log(`⚠️ Nieobsługiwany typ pliku: ${fileName} (${mimeType})`);
          return '';
        }
  
        if (!text || text.trim().length === 0) {
          Logger.log(`⚠️ Pusty tekst po przetworzeniu: ${fileName}`);
          return '';
        }
  
        if (text.length < 20) {
          Logger.log(`⚠️ Bardzo mało znaków (${text.length}) w pliku: ${fileName}`);
          text += '\n\n⚠️ Ostrzeżenie: mała ilość tekstu.';
        }
  
        return text;
  
      } catch (e) {
        Logger.log(`❌ Błąd performOCR dla pliku ${fileName}: ${e.message}`);
        return '';
      }
    }
  