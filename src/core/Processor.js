
    /**
   * Faza 1: przetwarzanie wsadowe plików źródłowych do plików .txt
   */
    function batchTextExtractionProcessor() {
      const ARCHIVE_FOLDER_ID = '19WgNzF9RPZY_clB5mzZpVbzp61KfbVOt';
      const PAGE_SIZE = 10;
      var generatedFiles = 0;
  
      const rootFolder = DriveApp.getFolderById(ARCHIVE_FOLDER_ID);
      const filesToProcess = getNonTxtFilesWithoutTxt(rootFolder);
  
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
  
          markAsProcessedText(file);
          generatedFiles++;
  
          Logger.log(`✅ Ukończono plik .txt dla: ${name}`);
  
        } catch (e) {
          Logger.log(`❌ Błąd ekstrakcji pliku: ${e.message}\n${e.stack}`);
        }
      }
  
      Logger.log(`🟢 Przetworzono ${generatedFiles} plików z ${PAGE_SIZE} możliwych.`);
    }


function batchMetadataGenerationProcessor() {
  const ARCHIVE_FOLDER_ID = '19WgNzF9RPZY_clB5mzZpVbzp61KfbVOt';
  const PAGE_SIZE = 10;
  let generatedFiles = 0;

  const rootFolder = DriveApp.getFolderById(ARCHIVE_FOLDER_ID);

  var filesToProcess = getTxtFilesWithoutMetadataJson(rootFolder);

  Logger.log('📄 Znaleziono %d plików .txt do przetworzenia.', filesToProcess.length);

  for (var i = 0; i < filesToProcess.length; i++) {
    if (generatedFiles >= PAGE_SIZE) break;
    var txtFile = filesToProcess[i];
    try {
      var parentFolder = getParentFolderSafe(txtFile);
      var baseName = txtFile.getName().replace(/\.txt$/, '');
      var jsonFileName = baseName + 'Metadata.json';

      Logger.log('🔵 Generuję metadata dla: %s', txtFile.getName());
      var text = txtFile.getBlob().getDataAsString();

      // 1. Wypełniamy szablon danymi systemowymi
      var localMetadata = Metadata.createMetadataJson(txtFile, text);

      // 2. Tworzymy prompt dla AI (przekazujemy już częściowo uzupełniony szablon!)
      var prompt = buildMetadataPrompt(localMetadata, text);

      // 3. Odpytanie API OpenAI
      var gptResponse = callOpenAIChatGPT(prompt, 2500);
      gptResponse = cleanJsonFromAI(gptResponse);

      // 4. Parsowanie odpowiedzi i walidacja
      var metadataObj;
      try {
        metadataObj = JSON.parse(gptResponse);
      } catch (e) {
        Logger.log('❌ Niepoprawny JSON od AI: ' + e.message);
        continue;
      }

      if (!validateMetadataJson(metadataObj)) {
        Logger.log('❌ Walidacja metadata.json nieudana!');
        continue;
      }

      // 5. Zapisujemy plik metadata.json
      var jsonBlob = Utilities.newBlob(JSON.stringify(metadataObj, null, 2), 'application/json', jsonFileName);
      parentFolder.createFile(jsonBlob);

      generatedFiles++;
      Logger.log('✅ Utworzono metadata.json dla: %s', txtFile.getName());
    } catch (e) {
      Logger.log('❌ Błąd generowania metadata: ' + e.message + '\n' + e.stack);
    }
  }
  Logger.log('🟢 Zakończono generowanie metadata dla %d plików.', generatedFiles);
}
