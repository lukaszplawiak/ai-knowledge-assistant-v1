/**
 * Cykliczny skrypt batch OCR:
 * - przetwarza nowe pliki z folderu /to-archive/
 * - wykonuje OCR lub parsowanie
 * - zapisuje plik .txt
 * - generuje metadata.json
 * - zapisuje metadata.json
 * - oznacza plik jako przetworzony
 */
function batchOCRProcessor() {
    const ARCHIVE_FOLDER_ID = '19WgNzF9RPZY_clB5mzZpVbzp61KfbVOt'; // ID folderu /to-archive/
    const rootFolder = DriveApp.getFolderById(ARCHIVE_FOLDER_ID);
    const PAGE_SIZE = 10; // Limit plików na batch
    let processedFiles = 0;
  
    const files = getAllFilesRecursively(rootFolder);
  
    for (const file of files) {
      try {
        const fileName = file.getName();
  
        if (fileName.endsWith('.txt') || fileName.endsWith('.json')) {
          continue;
        }
  
        if (checkIfProcessed(file)) {
          continue;
        }
  
        Logger.log(`🔵 Przetwarzam plik: ${fileName}`);
  
        const text = performOCR(file);
  
        saveTextFile(file, text);
  
        const metadata = generateMetadata(text);
  
        saveMetadataFile(file, metadata);
  
        markAsProcessed(file);
  
        processedFiles++;
        if (processedFiles >= PAGE_SIZE) {
          Logger.log(`🟡 Limit batcha osiągnięty (${PAGE_SIZE} plików). Kończę przetwarzanie.`);
          break;
        }
      } catch (e) {
        Logger.log(`❌ Błąd podczas przetwarzania pliku: ${e.message}\n${e.stack}`);
        continue;
      }
    }
  }
  
  /**
   * Rekurencyjnie zbiera wszystkie pliki z folderu i jego podfolderów.
   *
   * @param {Folder} folder - Folder początkowy
   * @returns {File[]} - Lista plików
   */
  function getAllFilesRecursively(folder) {
    let filesList = [];
  
    const files = folder.getFiles();
    while (files.hasNext()) {
      filesList.push(files.next());
    }
  
    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      const subfolder = subfolders.next();
      filesList = filesList.concat(getAllFilesRecursively(subfolder));
    }
  
    return filesList;
  }
  
  
  
  
    
    // funkcja tylko do testów !!
    function generateMetadata(text) {
    return {
      title: "Testowy tytuł",
      keywords: ["test", "plik"],
      summary: "Testowe streszczenie wygenerowane dla potrzeb testu."
    };
  }
  
  /**
   * Tworzy plik metadata.json zawierający dane opisowe wygenerowane przez AI.
   * Plik jest tworzony w tym samym folderze co oryginał.
   *
   * @param {File} file - Oryginalny plik (np. PDF, JPG, DOCX)
   * @param {Object} metadata - Obiekt metadanych (np. tytuł, keywords, streszczenie)
   */
  function saveMetadataFile(file, metadata) {
    try {
      const parentFolder = getParentFolderSafe(file);
      if (!parentFolder) {
        Logger.log(`⚠️ Pomijam zapis metadata.json dla ${file.getName()} — brak folderu nadrzędnego.`);
        return;
      }
  
      const baseName = file.getName().replace(/\.[^\.]+$/, '');
      const jsonFileName = baseName + '.json';
  
      const existingFiles = parentFolder.getFilesByName(jsonFileName);
      if (existingFiles.hasNext()) {
        Logger.log(`📄 Plik metadata ${jsonFileName} już istnieje — pomijam zapis.`);
        return;
      }
  
      const jsonString = JSON.stringify(metadata, null, 2);
      const jsonBlob = Utilities.newBlob(jsonString, 'application/json', jsonFileName);
      parentFolder.createFile(jsonBlob);
  
      Logger.log(`✅ Utworzono plik metadata.json: ${jsonFileName}`);
  
    } catch (e) {
      Logger.log(`❌ Błąd podczas zapisu metadata.json dla ${file.getName()}: ${e.message}`);
    }
  }
  
  /**
   * Oznacza plik jako przetworzony poprzez dodanie tagu w opis pliku.
   * (W polu description pliku w Drive ustawiamy znacznik: "processed: true")
   */
  function markAsProcessed(file) {
    try {
      file.setDescription('processed: true');
      Logger.log(`✅ Oznaczono plik jako przetworzony: ${file.getName()}`);
    } catch (e) {
      Logger.log(`❌ Błąd podczas oznaczania pliku ${file.getName()}: ${e.message}`);
    }
  }
  
  
  
  
  
    
    /**
   * Funkcja OCR/parsing: zwraca tekst z dokumentu (obraz lub PDF/Word).
   * - automatycznie rozpoznaje typ MIME
   * - decyduje: OCR vs parsowanie
   * - waliduje długość tekstu po OCR
   */
    function performOCR(file) {
        const mimeType = file.getMimeType();
        const fileName = file.getName();
        let text = '';
      
        if (mimeType.includes('google-apps') && mimeType !== 'application/vnd.google-apps.spreadsheet') {
          Logger.log(`⚠️ Pomijam nieobsługiwany plik: ${fileName} (${mimeType})`);
          return '';
        }
      
        if (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/tiff') {
          text = doOCRImage(file);
      
        } else if (mimeType === 'application/pdf') {
            if (!isValidExtractedText(text)) {
                Logger.log(`ℹ️ Parsowany tekst uznany za śmieciowy lub niewystarczający — wykonuję OCR...`);
                text = doOCRPDF(file); // używa OCR przez Drive.Files.insert z { ocr: true }
              }
      
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   mimeType === 'text/plain') {
          text = file.getBlob().getDataAsString();
      
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          text = parseExcel(file);
      
        } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
          text = parseGoogleSheet(file);
      
        } else {
          Logger.log(`⚠️ Nieobsługiwany typ pliku: ${fileName} (${mimeType})`);
          return '';
        }
      
        if (!text || text.trim().length === 0) {
          Logger.log(`⚠️ Pusty tekst — pomijam dalsze przetwarzanie: ${fileName}`);
          return '';
        }
      
        if (text.length < 20) {
          Logger.log(`⚠️ Bardzo mała ilość tekstu (${text.length} znaków) w pliku: ${fileName}`);
          text += "\n\n⚠️ Ostrzeżenie: mała ilość rozpoznanych znaków w tekście.";
        }
      
        return text;
      }
      
    /**
 * Waliduje jakość wyciągniętego tekstu:
 * - Sprawdza długość
 * - Liczbę liter alfabetu (w tym polskie)
 * - Stosunek liter do ogólnej liczby znaków
 * - Obecność typowych polskich słów
 *
 * Zwraca true jeśli tekst wygląda na wartościowy.
 */
function isValidExtractedText(text) {
    if (!text || typeof text !== 'string') return false;
  
    const trimmed = text.trim();
    if (trimmed.length < 50) return false; // zbyt krótki
  
    const letters = trimmed.match(/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g);
    if (!letters || letters.length < 20) return false; // za mało liter
  
    const letterRatio = letters.length / trimmed.length;
    if (letterRatio < 0.3) return false; // zbyt dużo cyfr/symboli względem liter
  
    const commonWords = ['ulica', 'faktura', 'data', 'zł', 'adres', 'nazwa', 'budynek', 'nr', 'kod'];
    const hasKeyword = commonWords.some(word => trimmed.toLowerCase().includes(word));
    if (!hasKeyword) return false; // brak typowego polskiego słownictwa
  
    return true;
  }
  
    
    /**
   * Próba wyciągnięcia tekstu z pliku PDF.
   * Jeśli PDF zawiera tekst — nie trzeba OCR.
   */
  function tryParseText(file) {
      try {
        const text = file.getBlob().getDataAsString();
        return text;
      } catch (e) {
        Logger.log(`❌ Błąd parsowania tekstu z ${file.getName()}: ${e.message}`);
        return '';
      }
    }
    
  
    /**
   * Wykonuje OCR na pliku graficznym (JPG/PNG)
   * Zwraca rozpoznany tekst z obrazu
   */
    function doOCRImage(file) {
    const resource = {
      title: file.getName().replace(/\.(jpg|jpeg|png|tiff)$/i, ''),
    };
  
    try {
      const ocrFile = Drive.Files.insert(resource, file.getBlob(), {
        ocr: true,
        ocrLanguage: 'pl'
      });
  
      const ocrDoc = DocumentApp.openById(ocrFile.id);
      const text = ocrDoc.getBody().getText();
  
      const parentFolder = getParentFolderSafe(file);
      if (parentFolder && text.trim().length > 0) {
        const txtBlob = Utilities.newBlob(
          text,
          'text/plain',
          file.getName().replace(/\.(jpg|jpeg|png|tiff)$/i, '') + '.txt'
        );
        parentFolder.createFile(txtBlob);
      }
  
      DriveApp.getFileById(ocrFile.id).setTrashed(true);
  
      return text;
  
    } catch (e) {
      Logger.log(`❌ Błąd podczas OCR pliku obrazu ${file.getName()}: ${e.message}`);
      return '';
    }
  }
  
  
    
    
  /**
   * Wykonuje OCR na pliku PDF:
   * - Konwertuje PDF na Google Docs przy użyciu Drive API v2
   * - Wyciąga tekst z dokumentu
   * - Tworzy plik .txt
   * - Usuwa tymczasowy plik Google Docs
   *
   * @param {File} file - Plik PDF do przetworzenia
   * @returns {string} - Tekst wyciągnięty z pliku
   */
  function doOCRPDF(file) {
    const resource = {
      title: file.getName().replace(/\.pdf$/i, ''),
    };
  
    try {
      const ocrFile = Drive.Files.insert(resource, file.getBlob(), {
        ocr: true,
        ocrLanguage: 'pl'
      });
  
      const ocrDoc = DocumentApp.openById(ocrFile.id);
      const text = ocrDoc.getBody().getText();
  
      const parentFolder = getParentFolderSafe(file);
      if (parentFolder && text.trim().length > 0) {
        const txtBlob = Utilities.newBlob(
          text,
          'text/plain',
          file.getName().replace(/\.pdf$/i, '') + '.txt'
        );
        parentFolder.createFile(txtBlob);
      }
  
      DriveApp.getFileById(ocrFile.id).setTrashed(true);
  
      Logger.log(`✅ OCR PDF zakończony sukcesem dla: ${file.getName()}`);
  
      return text;
  
    } catch (e) {
      Logger.log(`❌ Błąd podczas OCR pliku PDF ${file.getName()}: ${e.message}`);
      return '';
    }
  }
  
  function parseExcel(file) {
    try {
      const blob = file.getBlob();
      const resource = Drive.Files.insert(
        {
          title: file.getName(),
          mimeType: MimeType.GOOGLE_SHEETS
        },
        blob
      );
  
      const sheet = SpreadsheetApp.openById(resource.id);
      const sheets = sheet.getSheets();
      let allText = '';
  
      sheets.forEach(s => {
        const data = s.getDataRange().getValues();
        data.forEach(row => {
          allText += row.join(' ') + '\n';
        });
      });
  
      // Usuwamy tymczasowy Google Sheet
      DriveApp.getFileById(resource.id).setTrashed(true);
  
      return allText;
  
    } catch (e) {
      Logger.log(`❌ Błąd parsowania pliku Excel: ${e.message}`);
      return '';
    }
  }
  
  function parseGoogleSheet(file) {
    try {
      const sheet = SpreadsheetApp.open(file);
      const sheets = sheet.getSheets();
      let allText = '';
  
      sheets.forEach(s => {
        const data = s.getDataRange().getValues();
        data.forEach(row => {
          allText += row.join(' ') + '\n';
        });
      });
  
      return allText;
  
    } catch (e) {
      Logger.log(`❌ Błąd parsowania pliku Google Sheets: ${e.message}`);
      return '';
    }
  }
  
  
   /**
   * Tworzy plik .txt zawierający tekst wyciągnięty z OCR lub parsingu.
   * Plik jest tworzony w tym samym folderze co oryginał (jeśli istnieje).
   *
   * @param {File} file - Oryginalny plik (np. PDF, JPG, DOCX)
   * @param {string} text - Tekst wyciągnięty z pliku
   */
  function saveTextFile(file, text) {
    try {
        if (text.trim().length === 0) {
            Logger.log(`⚠️ Pomijam zapis pliku .txt — pusty tekst dla ${file.getName()}`);
            return;
          }
      const parentFolder = getParentFolderSafe(file);
      if (!parentFolder) {
        Logger.log(`⚠️ Pomijam zapis pliku .txt dla ${file.getName()} — brak folderu nadrzędnego.`);
        return;
      }
  
      const baseName = file.getName().replace(/\.[^\.]+$/, '');
      const txtFileName = baseName + '.txt';
  
      const existingFiles = parentFolder.getFilesByName(txtFileName);
      if (existingFiles.hasNext()) {
        Logger.log(`📄 Plik tekstowy ${txtFileName} już istnieje — pomijam tworzenie.`);
        return;
      }
  
      const txtBlob = Utilities.newBlob(text, 'text/plain', txtFileName);
      parentFolder.createFile(txtBlob);
  
      Logger.log(`✅ Utworzono plik .txt: ${txtFileName}`);
  
    } catch (e) {
      Logger.log(`❌ Błąd podczas zapisu pliku .txt dla ${file.getName()}: ${e.message}`);
    }
  }
  
  function getParentFolderSafe(file) {
    try {
      const parents = file.getParents();
      if (parents.hasNext()) {
        return parents.next();
      } else {
        Logger.log(`⚠️ Plik ${file.getName()} nie ma folderu nadrzędnego — pomijam.`);
        return null;
      }
    } catch (e) {
      Logger.log(`❌ Błąd przy pobieraniu folderu nadrzędnego dla ${file.getName()}: ${e.message}`);
      return null;
    }
  }
  
    /**
   * Sprawdza czy plik został już przetworzony (czyli czy ma description = "processed: true").
   *
   * @param {File} file - Plik do sprawdzenia.
   * @returns {boolean} - true jeśli przetworzony, false jeśli nowy.
   */
    function checkIfProcessed(file) {
        try {
          const parentFolder = file.getParents().hasNext() ? file.getParents().next() : null;
          if (!parentFolder) return false;
      
          const baseName = file.getName().replace(/\.[^\.]+$/, '');
          const txtExists = parentFolder.getFilesByName(baseName + '.txt').hasNext();
          const jsonExists = parentFolder.getFilesByName(baseName + '.json').hasNext();
      
          return txtExists && jsonExists;
        } catch (e) {
          Logger.log(`❌ Błąd podczas sprawdzania przetworzenia pliku ${file.getName()}: ${e.message}`);
          return false;
        }
      }
      
    
    
    /**
   * Nocna funkcja archiwizująca:
   * 1. Tworzy całą strukturę folderów z to-archive/ w archived/
   * 2. Kopiuje pliki (oryginał, .txt, .json) i usuwa je z to-archive/ po sukcesie
   */
  function nightlyArchiver() {
      const SOURCE_FOLDER_ID = 'ID_TO_ARCHIVE';    // <- Podmień na ID folderu /to-archive/
      const DESTINATION_FOLDER_ID = 'ID_ARCHIVED'; // <- Podmień na ID folderu /archived/
    
      const sourceFolder = DriveApp.getFolderById(SOURCE_FOLDER_ID);
      const destinationFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);
    
      Logger.log('🔵 Start: Budowanie struktury folderów...');
      buildFolderStructure(sourceFolder, destinationFolder);
      Logger.log('✅ Struktura folderów utworzona.');
    
      Logger.log('🔵 Start: Kopiowanie plików i czyszczenie...');
      copyFilesAndCleanup(sourceFolder, destinationFolder);
      Logger.log('✅ Pliki skopiowane i usunięte.');
    }
  
    /**
   * Rekurencyjnie odwzorowuje strukturę katalogów bez kopiowania plików.
   * Tylko tworzy puste foldery w archived/ odwzorowując strukturę to-archive/.
   */
  function buildFolderStructure(sourceFolder, destinationFolder) {
      const subfolders = sourceFolder.getFolders();
      
      while (subfolders.hasNext()) {
        const subfolder = subfolders.next();
        const subfolderName = subfolder.getName();
    
        let targetSubfolder;
        const existingFolders = destinationFolder.getFoldersByName(subfolderName);
        if (existingFolders.hasNext()) {
          targetSubfolder = existingFolders.next();
          Logger.log(`ℹ️ Folder ${subfolderName} już istnieje w archived/`);
        } else {
          targetSubfolder = destinationFolder.createFolder(subfolderName);
          Logger.log(`🗂️ Utworzono folder: ${subfolderName}`);
        }
    
        // Rekurencyjne przejście przez podfoldery
        buildFolderStructure(subfolder, targetSubfolder);
      }
    }
  
    /**
   * Kopiuje pliki (oryginał, .txt, .json) z to-archive/ do archived/
   * Po skopiowaniu pliku — usuwa go z to-archive/.
   */
  function copyFilesAndCleanup(sourceFolder, destinationFolder) {
      const files = sourceFolder.getFiles();
      
      while (files.hasNext()) {
        const file = files.next();
        const fileName = file.getName().toLowerCase();
    
        // Kopiujemy tylko wybrane typy plików
        const isValidFile =
          !(file.getMimeType().includes('google-apps')) && (
            fileName.endsWith('.pdf') ||
            fileName.endsWith('.docx') ||
            fileName.endsWith('.xlsx') ||
            fileName.endsWith('.jpg') ||
            fileName.endsWith('.png') ||
            fileName.endsWith('.tiff') ||
            fileName.endsWith('.txt') ||
            fileName.endsWith('.json')
          );
    
        if (isValidFile) {
          try {
            const existingFiles = destinationFolder.getFilesByName(file.getName());
            if (existingFiles.hasNext()) {
              Logger.log(`⚠️ Plik ${file.getName()} już istnieje w archived/, pomijam.`);
              continue;
            }
    
            // Kopiowanie pliku
            file.makeCopy(file.getName(), destinationFolder);
            Logger.log(`✅ Skopiowano plik: ${file.getName()}`);
    
            // Usunięcie pliku źródłowego
            file.setTrashed(true);
            Logger.log(`🗑️ Usunięto plik z to-archive/: ${file.getName()}`);
            
          } catch (e) {
            Logger.log(`❌ Błąd kopiowania pliku ${file.getName()}: ${e.message}\n${e.stack}`);
          }
        }
      }
    
      // Rekurencyjnie kopiujemy pliki w podfolderach
      const subfolders = sourceFolder.getFolders();
      
      while (subfolders.hasNext()) {
        const subfolder = subfolders.next();
        const subfolderName = subfolder.getName();
    
        const existingFolders = destinationFolder.getFoldersByName(subfolderName);
        if (existingFolders.hasNext()) {
          const targetSubfolder = existingFolders.next();
          copyFilesAndCleanup(subfolder, targetSubfolder);
        } else {
          Logger.log(`⚠️ Podfolder ${subfolderName} nie istnieje w archived/. Pomijam.`);
        }
      }
    }
    
    /**
   * Tygodniowy archiwizator:
   * - Buduje strukturę folderów z /to-archive/ do /archived/
   * - Kopiuje pliki i je usuwa z oryginalnych lokalizacji
   * - Dodaje paginację i logowanie błędów
   * - Gotowe do odpalenia 1x/tydzień
   */
  function weeklyArchiver() {
    const SOURCE_FOLDER_ID = 'ID_TO_ARCHIVE';    // <- Podmień na ID folderu /to-archive/
    const DESTINATION_FOLDER_ID = 'ID_ARCHIVED'; // <- Podmień na ID folderu /archived/
  
    const sourceFolder = DriveApp.getFolderById(SOURCE_FOLDER_ID);
    const destinationFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);
  
    Logger.log('🔵 START: Synchronizacja tygodniowa');
  
    try {
      Logger.log('📁 Buduję strukturę folderów...');
      buildFolderStructure(sourceFolder, destinationFolder);
      Logger.log('✅ Struktura folderów utworzona.');
  
      Logger.log('📄 Rozpoczynam kopiowanie plików...');
      copyFilesAndCleanupWithPagination(sourceFolder, destinationFolder);
      Logger.log('✅ Kopiowanie zakończone.');
  
    } catch (e) {
      Logger.log(`❌ Błąd krytyczny synchronizacji: ${e.message}\n${e.stack}`);
    }
  
    Logger.log('🔚 KONIEC: Synchronizacja tygodniowa');
  }
  
  /**
   * Kopiuje pliki z folderów rekurencyjnie z paginacją i logowaniem błędów -> ustawić weekly triggera na tą metodę !
   */
  function copyFilesAndCleanupWithPagination(sourceFolder, destinationFolder, level = 0) {
    const indent = '  '.repeat(level);
    const files = sourceFolder.getFiles();
  
    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();
  
      const isValidFile =
        !(file.getMimeType().includes('google-apps')) && (
          fileName.endsWith('.pdf') ||
          fileName.endsWith('.docx') ||
          fileName.endsWith('.xlsx') ||
          fileName.endsWith('.jpg') ||
          fileName.endsWith('.png') ||
          fileName.endsWith('.tiff') ||
          fileName.endsWith('.txt') ||
          fileName.endsWith('.json')
        );
  
      if (!isValidFile) {
        Logger.log(`${indent}⚠️ Pomijam plik niekwalifikowany: ${fileName}`);
        continue;
      }
  
      try {
        const existingFiles = destinationFolder.getFilesByName(fileName);
        if (existingFiles.hasNext()) {
          Logger.log(`${indent}⚠️ Plik już istnieje: ${fileName}, pomijam.`);
          continue;
        }
  
        file.makeCopy(fileName, destinationFolder);
        file.setTrashed(true);
        Logger.log(`${indent}✅ Skopiowano i usunięto: ${fileName}`);
  
      } catch (e) {
        Logger.log(`${indent}❌ Błąd kopiowania ${fileName}: ${e.message}`);
      }
    }
  
    const subfolders = sourceFolder.getFolders();
  
    while (subfolders.hasNext()) {
      const subfolder = subfolders.next();
      const name = subfolder.getName();
  
      const existing = destinationFolder.getFoldersByName(name);
      const targetSubfolder = existing.hasNext()
        ? existing.next()
        : destinationFolder.createFolder(name);
  
      Logger.log(`${indent}📂 Wchodzę do podfolderu: ${name}`);
      copyFilesAndCleanupWithPagination(subfolder, targetSubfolder, level + 1);
    }
  }
  
    