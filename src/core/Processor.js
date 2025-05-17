const Processor = (() => {
    const { getAllFilesRecursively, markAsProcessedText, saveMetadataFile, saveTextFile } = FileUtils;
    const { performParsingWithFallback } = Parser;
    const { generateMetadata } = Metadata;
  

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
        const parent = FileUtils.getParentFolderSafe(txtFile);
        const jsonName = txtFile.getName().replace(/\.txt$/, '.json');
        if (!parent || parent.getFilesByName(jsonName).hasNext()) continue;

        Logger.log(`🔵 Generuję metadata dla: ${txtFile.getName()}`);
        const text = txtFile.getBlob().getDataAsString();
        const metadata = generateMetadataFromText(txtFile, text);

        saveMetadataFile(txtFile, metadata);
        generatedFiles++;
        Logger.log(`✅ Utworzono metadata.json dla: ${txtFile.getName()}`);
      } catch (e) {
        Logger.log(`❌ Błąd generowania metadata: ${e.message}\n${e.stack}`);
      }
    }
    Logger.log(`🟢 Zakończono generowanie metadata dla ${generatedFiles} plików.`);
  }
    
  
    return { 
      batchTextExtractionProcessor, 
      batchMetadataGenerationProcessor };
  })();

  // dobry
  