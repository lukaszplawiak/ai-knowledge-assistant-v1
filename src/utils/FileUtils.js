
/**
 * Zwraca wszystkie pliki .txt w folderze i podfolderach, które NIE mają odpowiadającego .json (czyli baseName.json).
 * Bardzo wydajna – minimalizuje liczbę operacji, nie zbiera niepotrzebnych plików.
 */
function getTxtFilesWithoutMetadataJson(folder) {
  const result = [];
  const txtFiles = [];

  // 1. Zbierz wszystkie pliki .txt z folderu
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    if (name.endsWith('.txt')) {
      txtFiles.push(file);
    }
  }

  // 2. Dla każdego .txt sprawdź, czy istnieje .txtMetadata.json
  for (const txtFile of txtFiles) {
    const baseName = txtFile.getName().replace(/\.txt$/, '');
    const metadataJsonName = baseName + 'Metadata.json';
    const parent = getParentFolderSafe(txtFile);
    // Szybko sprawdzamy, czy plik metadata.json istnieje
    if (!parent.getFilesByName(metadataJsonName).hasNext()) {
      result.push(txtFile);
    }
  }

  // 3. Rekurencja w podfolderach
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    result.push(...getTxtFilesWithoutMetadataJson(subfolder));
  }

  return result;
}


/**
 * Zwraca pliki źródłowe (np. PDF, DOCX, XLSX, obrazy) bez odpowiadającego im pliku .txt.
 * - Nie zwraca plików .txt ani .json.
 * - Przechodzi rekurencyjnie po całej strukturze folderów.
 * - Szybko przeszukuje mapę baseName'ów tylko lokalnie w folderze.
 *
 * @param {Folder} folder
 * @returns {File[]} Tablica plików źródłowych bez .txt obok siebie.
 */
function getNonTxtFilesWithoutTxt(folder) {  // OK
  const result = [];
  const baseNameToFiles = {};

  // 1. Skanujemy wszystkie pliki w bieżącym folderze
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    const baseName = name.replace(/\.[^\.]+$/, '');

    if (!baseNameToFiles[baseName]) baseNameToFiles[baseName] = {};
    baseNameToFiles[baseName][ext] = file;
  }

  // 2. Wybieramy tylko te baseName, gdzie NIE MA pliku txt i NIE są to .txt/.json
  for (var baseName in baseNameToFiles) {
    const exts = Object.keys(baseNameToFiles[baseName]);
    // jeżeli nie ma .txt wśród rozszerzeń
    if (!exts.includes('txt')) {
      for (var ext in baseNameToFiles[baseName]) {
        if (ext !== 'txt' && ext !== 'json') {
          result.push(baseNameToFiles[baseName][ext]);
        }
      }
    }
  }

  // 3. Rekurencja na podfolderach
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    result.push.apply(result, getNonTxtFilesWithoutTxt(subfolder));
  }

  return result;
}
    
    /**
     * Zwraca folder nadrzędny pliku lub null jeśli brak.
     * @param {GoogleAppsScript.Drive.File} file
     * @returns {GoogleAppsScript.Drive.Folder|null}
     */
    function getParentFolderSafe(file) {  // OK
      try {
        const parents = file.getParents();
        if (parents.hasNext()) return parents.next();
        Logger.log(`⚠️ Plik ${file.getName()} nie ma folderu nadrzędnego`);
        return null;
      } catch (e) {
        Logger.log(`❌ Błąd przy pobieraniu folderu nadrzędnego dla ${file.getName()}: ${e.message}`);
        return null;
      }
    }

    /**
     * Sprawdza, czy plik został już przetworzony — czyli czy w folderze istnieją jego .txt i .json
     * @param {GoogleAppsScript.Drive.File} file
     * @returns {boolean}
     */
    function checkIfProcessed(file) {
      try {
        const parentFolder = getParentFolderSafe(file);
        if (!parentFolder) return;
  
        const baseName = file.getName().replace(/\.[^\.]+$/, '');
        const txtExists = parentFolder.getFilesByName(baseName + '.txt').hasNext();
        const jsonExists = parentFolder.getFilesByName(baseName + '.json').hasNext();
  
        return txtExists && jsonExists;

      } catch (e) {
        Logger.log(`❌ Błąd sprawdzania przetworzenia: ${e.message}`);
        return false;
      }
    }
  
    /**
     * Oznacza plik jako przetworzony przez zapis w opisie.
     * @param {GoogleAppsScript.Drive.File} file
     */
    function markAsProcessedText(file) {  // OK
      try {
        file.setDescription('processedText: true');
        Logger.log(`🔖 Oznaczono plik jako przetworzony: ${file.getName()}`);
      } catch (e) {
        Logger.log(`❌ Błąd oznaczania pliku: ${e.message}`);
      }
    }

      /**
   * Rekurencyjnie odwzorowuje strukturę katalogów bez kopiowania plików.
   * Tylko tworzy puste foldery w archived/ odwzorowując strukturę to-archive/.
   */
  function buildFolderStructure(sourceFolder, destinationFolder) {  // OK
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

    buildFolderStructure(subfolder, targetSubfolder);
  }
}

   /**
   * Kopiuje pliki (oryginał, .txt, .json) z to-archive/ do archived/
   * Po skopiowaniu pliku — usuwa go z to-archive/.
   */
   function copyFilesAndCleanup(sourceFolder, destinationFolder) {  // OK
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
   * Kopiuje pliki z folderów rekurencyjnie z paginacją i logowaniem błędów -> ustawić weekly triggera na tą metodę !
   */
  function copyFilesAndCleanupWithPagination(sourceFolder, destinationFolder, level = 0) {  // OK
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

      // --- Kopiujemy i sprawdzamy sukces ---
      const copy = file.makeCopy(fileName, destinationFolder);
      if (copy && copy.getSize() === file.getSize()) {
        file.setTrashed(true);
        Logger.log(`${indent}✅ Skopiowano i usunięto: ${fileName}`);
      } else {
        Logger.log(`${indent}❌ NIEPEŁNA kopia pliku: ${fileName} (rozmiar niezgodny)`);
      }
    } catch (e) {
      Logger.log(`${indent}❌ Błąd kopiowania ${fileName}: ${e.message}`);
    }
  }

  // Przechodzimy do podfolderów
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
 
   /**
 * Oczekuje aż Google Docs będzie gotowy do pobrania treści.
 * Próbujemy wielokrotnie otworzyć dokument i wyciągnąć tekst.
 */
function waitForDocumentReady(docId, maxAttempts = 8, delayMs = 500) {  // OK
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const doc = DocumentApp.openById(docId);
        const text = doc.getBody().getText();
        if (text && text.trim().length > 0) {
          Logger.log(`✅ Dokument gotowy przy próbie ${i + 1}`);
          return text;
        }
      } catch (e) {
        Logger.log(`🔁 Próba ${i + 1}: Dokument jeszcze niegotowy (${e.message})`);
      }
      Utilities.sleep(delayMs);
    }
  
    Logger.log(`❌ Dokument nie gotowy po ${maxAttempts} próbach`);
    return '';
  }

