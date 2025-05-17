// src/parsers/ImageParser.js
const ImageParser = (() => {
    const { getParentFolderSafe, isValidExtractedText } = FileUtils;
  
    /**
     * Wykonuje OCR na obrazie (JPG, PNG, TIFF).
     * - W razie sukcesu zapisuje .txt i usuwa tymczasowy plik.
     * - Jeśli OCR dał pusty lub śmieciowy wynik — zwraca pusty string.
     * 
     * @param {File} file - obraz do przetworzenia
     * @returns {string} - rozpoznany tekst lub pusty string
     */
    function doOCRImage(file) {
      const baseName = file.getName().replace(/\.[^\.]+$/, '');
      const resource = {
        title: baseName,
      };
  
      try {
        // 📄 Utwórz tymczasowy dokument Google Docs z OCR
        const ocrFile = Drive.Files.insert(resource, file.getBlob(), {
          ocr: true,
          ocrLanguage: 'pl'
        });
  
        const docId = ocrFile.id;
        const text = DocumentApp.openById(docId).getBody().getText();
        DriveApp.getFileById(docId).setTrashed(true);
  
        if (!isValidExtractedText(text)) {
          Logger.log(`⚠️ OCR z obrazu uznany za nieczytelny lub pusty: ${file.getName()}`);
          return '';
        }
  
        // 💾 Zapisz .txt obok oryginalnego pliku
        const parentFolder = getParentFolderSafe(file);
        if (parentFolder) {
          const txtBlob = Utilities.newBlob(text, 'text/plain', `${baseName}.txt`);
          parentFolder.createFile(txtBlob);
          Logger.log(`✅ Utworzono plik .txt z OCR: ${baseName}.txt`);
        }
  
        return text;
  
      } catch (e) {
        Logger.log(`❌ Błąd OCR obrazu ${file.getName()}: ${e.message}`);
        return '';
      }
    }
  
    return { doOCRImage };
  })();
  