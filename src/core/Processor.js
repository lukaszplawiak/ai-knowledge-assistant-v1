
    /**
   * Faza 1: przetwarzanie wsadowe plików źródłowych do plików .txt
   */
    function batchTextExtractionProcessor() {
      const ARCHIVE_FOLDER_ID = '19WgNzF9RPZY_clB5mzZpVbzp61KfbVOt';
      const PAGE_SIZE = 10;
      let generatedFiles = 0;
  
      const rootFolder = DriveApp.getFolderById(ARCHIVE_FOLDER_ID);
      const filesToProcess = getAllFilesRecursively(rootFolder, 'txt');
  
      Logger.log(`📦 Znaleziono ${filesToProcess.length} kandydatów do przetworzenia.`);
  
      for (const file of filesToProcess) {
        if (generatedFiles >= PAGE_SIZE) {
          Logger.log(`🟡 Limit batcha osiągnięty (${PAGE_SIZE} plików). Kończę przetwarzanie.`);
          break;
        }
  
        try {
          const name = file.getName();
          Logger.log(`🔵 Ekstrakcja tekstu z: ${name}`);
  
          const text = performParsingWithFallback(file);
          if (!text || text.trim().length === 0) {
            Logger.log(`⚠️ Pusty wynik ekstrakcji — pomijam: ${name}`);
            continue;
          }
  
          saveTextFile(file, text);
  
          // const metadata = generateMetadata(file, text);
          // saveMetadataFile(file, metadata);            stare podejście
  
          markAsProcessedText(file);
          generatedFiles++;
  
          Logger.log(`✅ Ukończono plik .txt dla: ${name}`);
  
        } catch (e) {
          Logger.log(`❌ Błąd ekstrakcji pliku: ${e.message}\n${e.stack}`);
        }
      }
  
      Logger.log(`🟢 Przetworzono ${generatedFiles} plików z ${PAGE_SIZE} możliwych.`);
    }
  
    /**
   * Faza 2: generowanie metadanych JSON z plików .txt
   */
  function batchMetadataGenerationProcessor() {
    const ARCHIVE_FOLDER_ID = '19WgNzF9RPZY_clB5mzZpVbzp61KfbVOt';
    const PAGE_SIZE = 10;
    let generatedFiles = 0;

    const rootFolder = DriveApp.getFolderById(ARCHIVE_FOLDER_ID);
    const filesToProcess = getAllFilesRecursively(rootFolder)
      .filter(file => file.getName().endsWith('.txt'));

    Logger.log(`📄 Znaleziono ${filesToProcess.length} plików .txt bez metadata.json.`);

    for (const txtFile of filesToProcess) {
      if (generatedFiles >= PAGE_SIZE) break;
      try {
        const parentFolder = getParentFolderSafe(txtFile);
        const jsonName = txtFile.getName().replace(/\.txt$/, '.json');
        if (!parentFolder || parentFolder.getFilesByName(jsonName).hasNext()) continue;

        // początek wywołania API :
        Logger.log(`🔵 Generuję metadata dla: ${txtFile.getName()}`);
        const text = txtFile.getBlob().getDataAsString();
        const prompt = buildMetadataPrompt(text);
        const gptResponse = callOpenAIChatGPT(prompt, 2500);

        // const metadata = generateMetadataFromText(txtFile, text);

        // Próbujemy sparsować odpowiedź jako JSON
    let metadataObj;
    try {
      metadataObj = JSON.parse(gptResponse);
    } catch (e) {
      Logger.log('❌ Niepoprawny JSON w odpowiedzi AI: ' + e.message);
      return;
    }

    // Walidacja struktury
    if (!validateMetadataJson(metadataObj)) {
      Logger.log('❌ Błąd walidacji struktury metadata.json.');
      return;
    }

        // saveMetadataFile(txtFile, metadata);
// sprawdzić czy nie mona lepiej produkcyjnie zapisywać pliku ?!
        const baseName = txtFile.getName().replace(/\.txt$/, '');
        const jsonFileName = baseName + 'Metadata.json';
        const jsonBlob = Utilities.newBlob(JSON.stringify(metadataObj, null, 2), 'application/json', jsonFileName);
        parentFolder.createFile(jsonBlob);

        generatedFiles++;

        Logger.log(`✅ Utworzono metadata.json dla: ${txtFile.getName()}`);
      } catch (e) {
        Logger.log(`❌ Błąd generowania metadata: ${e.message}\n${e.stack}`);
      }
    }
    Logger.log(`🟢 Zakończono generowanie metadata dla ${generatedFiles} plików.`);
  }
    

 /**
 * Waliduje, czy przekazany obiekt spełnia wymaganą strukturę metadata.json.
 * Zwraca true/false i opcjonalnie loguje błędy.
 * @param {object} json - Sparsowany JSON z odpowiedzi AI.
 */
function validateMetadataJson(json) {
  // Lista wymaganych pól głównych
  const requiredFields = [
    "fileName", "fileType", "documentType",
    "project", "document", "communication",
    "textData", "excelData", "meta"
  ];
  for (let field of requiredFields) {
    if (!(field in json)) {
      Logger.log(`❌ Brak pola głównego: ${field}`);
      return false;
    }
  }
  // Przykład: możesz dodać dodatkowe walidacje (np. typów, podstruktur, wymaganych pól wewnątrz)
  // Np. czy textData.keywords to array, czy meta.metadataVersion === '1.0', itp.
  // ...
  return true;
}



  // dobry
  