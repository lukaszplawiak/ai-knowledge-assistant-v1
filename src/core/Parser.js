// src/core/OCR.js
const Parser = (() => {
    const { isValidExtractedText } = TextUtils;
    const { doOCRPDF, tryParseText } = PdfParser;
    const { convertDocxToGoogleDocText,tryParseDocx } = DocxParser;
    const { doOCRImage } = ImageParser;
    const { parseExcelSafe } = ExcelParser;
    const { parseGoogleSheet } = GoogleSheetParser;
  
    /**
     * Główna funkcja przetwarzania pliku:
     * - wybiera odpowiedni parser/OCR w zależności od MIME typu
     * - fallbackuje jeśli potrzeba
     *
     * @param {File} file - plik wejściowy
     * @returns {string} - przetworzony tekst
     */
    function performParsingWithFallback(file) {
      const mimeType = file.getMimeType();
      const fileName = file.getName();
      let text = '';
  
      if (mimeType.includes('google-apps') && mimeType !== 'application/vnd.google-apps.spreadsheet') {
        Logger.log(`⚠️ Pomijam nieobsługiwany typ pliku: ${fileName} (${mimeType})`);
        return '';
      }
  
      try {
        // 🖼️ Obrazy: natychmiast OCR
        if (/image\/(jpeg|jpg|png|tiff)/.test(mimeType)) {
          text = doOCRImage(file);
        }
        else if (mimeType === 'application/pdf') {
          text = tryParseText(file);
          if (!isValidExtractedText(text)) {
            Logger.log(`ℹ️ Parsowanie PDF nieudane — fallback do OCR`);
            text = doOCRPDF(file);
          }
  
         // 📃 DOCX: parsowanie → konwersja → OCR
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = tryParseDocx(file);
      if (!isValidExtractedText(text)) {
        Logger.log(`ℹ️ DOCX: Parsowanie zawiodło — próbuję konwersję`);
        text = convertDocxToGoogleDocText(file);
        if (!isValidExtractedText(text)) {
          Logger.log(`ℹ️ DOCX: Konwersja zawiodła — wykonuję OCR`);
          text = doOCRPDF(file);
        }
      }
    }
  
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
  
    return { performParsingWithFallback };
  })();
  





// src/core/OCR.js
// const OCR = (() => {
//     const { getParentFolderSafe, waitForDocumentReady } = FileUtils;
//     const { isValidExtractedText } = TextUtils;
  
//     /**
//      * Główna funkcja rozpoznawania tekstu.
//      * Wybiera metodę: OCR, parsowanie lub konwersja.
//      * @param {File} file - plik wejściowy
//      * @returns {string} - przetworzony tekst
//      */
//     function performOCR(file) {
//       const mimeType = file.getMimeType();
//       const fileName = file.getName();
//       let text = '';
  
//       if (mimeType.includes('google-apps') && mimeType !== 'application/vnd.google-apps.spreadsheet') {
//         Logger.log(`⚠️ Pomijam nieobsługiwany plik: ${fileName} (${mimeType})`);
//         return '';
//       }
  
//       if (mimeType.match(/image\/(jpeg|png|tiff)/)) {
//         text = doOCRImage(file);
//       } else if (mimeType === 'application/pdf') {
//         text = tryParseText(file);
//         if (!isValidExtractedText(text)) {
//           Logger.log(`ℹ️ Parsowany tekst PDF uznany za śmieciowy — uruchamiam OCR...`);
//           text = doOCRPDF(file);
//         }
//       } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
//         text = file.getBlob().getDataAsString();
//         if (!isValidExtractedText(text)) {
//           Logger.log(`ℹ️ Parsowanie DOCX nieudane — konwertuję do Google Docs...`);
//           text = convertDocxToGoogleDocText(file);
//           if (!text) {
//             Logger.log(`🔁 Konwersja DOCX do Google Docs również zawiodła — fallback do OCR...`);
//             text = doOCRPDF(file);
//           }
//         }
//       } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
//         text = Parsers.parseExcel(file);
//       } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
//         text = Parsers.parseGoogleSheet(file);
//       } else {
//         Logger.log(`⚠️ Nieobsługiwany typ pliku: ${fileName} (${mimeType})`);
//         return '';
//       }
  
//       if (!text || text.trim().length === 0) {
//         Logger.log(`⚠️ Pusty tekst — pomijam dalsze przetwarzanie: ${fileName}`);
//         return '';
//       }
  
//       if (text.length < 20) {
//         Logger.log(`⚠️ Bardzo mała ilość tekstu (${text.length} znaków) w pliku: ${fileName}`);
//         text += '\n\n⚠️ Ostrzeżenie: mała ilość rozpoznanych znaków.';
//       }
  
//       return text;
//     }
  
//     /**
//      * OCR obrazu (JPG/PNG/TIFF)
//      */
//     function doOCRImage(file) {
//       const resource = {
//         title: file.getName().replace(/\.(jpg|jpeg|png|tiff)$/i, ''),
//       };
  
//       try {
//         const ocrFile = Drive.Files.insert(resource, file.getBlob(), {
//           ocr: true,
//           ocrLanguage: 'pl'
//         });
  
//         const ocrDoc = DocumentApp.openById(ocrFile.id);
//         const text = ocrDoc.getBody().getText();
  
//         const parentFolder = getParentFolderSafe(file);
//         if (parentFolder && text.trim().length > 0) {
//           const txtBlob = Utilities.newBlob(text, 'text/plain', file.getName().replace(/\.(jpg|jpeg|png|tiff)$/i, '') + '.txt');
//           parentFolder.createFile(txtBlob);
//         }
  
//         DriveApp.getFileById(ocrFile.id).setTrashed(true);
//         return text;
  
//       } catch (e) {
//         Logger.log(`❌ Błąd OCR obrazu ${file.getName()}: ${e.message}`);
//         return '';
//       }
//     }
  
//     /**
//      * OCR PDF-a przez konwersję na Google Docs
//      */
//     function doOCRPDF(file) {
//       const resource = {
//         title: file.getName().replace(/\.pdf$/i, ''),
//       };
  
//       try {
//         const ocrFile = Drive.Files.insert(resource, file.getBlob(), {
//           ocr: true,
//           ocrLanguage: 'pl'
//         });
  
//         const text = DocumentApp.openById(ocrFile.id).getBody().getText();
  
//         const parentFolder = getParentFolderSafe(file);
//         if (parentFolder && text.trim().length > 0) {
//           const txtBlob = Utilities.newBlob(text, 'text/plain', file.getName().replace(/\.pdf$/i, '') + '.txt');
//           parentFolder.createFile(txtBlob);
//         }
  
//         DriveApp.getFileById(ocrFile.id).setTrashed(true);
//         return text;
  
//       } catch (e) {
//         Logger.log(`❌ Błąd OCR PDF ${file.getName()}: ${e.message}`);
//         return '';
//       }
//     }
  
//     /**
//      * Konwertuje DOCX do Google Docs i pobiera tekst
//      */
//     function convertDocxToGoogleDocText(file) {
//       const resource = {
//         title: file.getName().replace(/\.docx$/i, ''),
//         mimeType: 'application/vnd.google-apps.document'
//       };
  
//       try {
//         const gdoc = Drive.Files.insert(resource, file.getBlob());
//         const text = waitForDocumentReady(gdoc.id, 6, 800);
  
//         DriveApp.getFileById(gdoc.id).setTrashed(true);
  
//         if (!text || !isValidExtractedText(text)) return null;
  
//         const parentFolder = getParentFolderSafe(file);
//         if (parentFolder) {
//           const txtBlob = Utilities.newBlob(text, 'text/plain', file.getName().replace(/\.docx$/, '') + '.txt');
//           parentFolder.createFile(txtBlob);
//         }
  
//         return text;
  
//       } catch (e) {
//         Logger.log(`❌ Błąd konwersji DOCX ${file.getName()}: ${e.message}`);
//         return null;
//       }
//     }
  
//     /**
//      * Próba wyciągnięcia tekstu bez OCR
//      */
//     function tryParseText(file) {
//       try {
//         return file.getBlob().getDataAsString();
//       } catch (e) {
//         Logger.log(`❌ Błąd parsowania pliku ${file.getName()}: ${e.message}`);
//         return '';
//       }
//     }
  
//     return {
//       performOCR,
//       doOCRImage,
//       doOCRPDF,
//       convertDocxToGoogleDocText,
//       tryParseText
//     };
//   })();

