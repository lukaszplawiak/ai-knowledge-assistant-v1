  /**
   * Sprawdza jakość wyciągniętego tekstu:
   * - długość
   * - liczba liter
   * - stosunek liter do ogólnej liczby znaków
   * - obecność typowych słów
   * @param {string} text
   * @returns {boolean}
   */
  function isValidExtractedText(text, { minLength = 30, allowNumericTables = true } = {}) {  // OK
    if (!text || typeof text !== 'string') {
      Logger.log(`❌ Walidacja tekstu nieudana: brak lub nie tekst`);
      return false;
    }
  
    const trimmed = text.trim();
    if (trimmed.length < minLength) {
      Logger.log(`❌ Walidacja: tekst zbyt krótki (${trimmed.length} znaków)`);
      return false;
    }
  
    // Dopasowanie liter (w tym polskich)
    const letters = trimmed.match(/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g) || [];
    const letterRatio = letters.length / trimmed.length;
  
    if (!allowNumericTables && letterRatio < 0.3) {
      Logger.log(`❌ Walidacja: zbyt niski stosunek liter (${(letterRatio * 100).toFixed(1)}%)`);
      return false;
    }
  
    // Lista typowych słów kluczowych (można rozszerzyć w razie potrzeby)
    const commonWords = ['ulica', 'faktura', 'data', 'zł', 'adres', 'nazwa', 'budynek', 'nr', 'kod', 'tak'];
    const hasKeyword = commonWords.some(word => trimmed.toLowerCase().includes(word));
    
    // Jeśli tekst ma mało liter i nie zawiera żadnego typowego słowa – to podejrzany
    if (letterRatio < 0.2 && !hasKeyword) {
      Logger.log(`❌ Walidacja: tekst podejrzany (brak typowych słów, mało liter)`);
      return false;
    }
  
    return true;
  }
  
  function extractSheetText(sheet) {
      const sheets = sheet.getSheets();
      return sheets.map(s => {
        const data = s.getDataRange().getValues();
        return data.map(row => row.join(' ')).join('\n');
      }).join('\n');
    }

       /**
     * Tworzy plik .txt w folderze pliku źródłowego, jeśli jeszcze nie istnieje.
     * @param {GoogleAppsScript.Drive.File} file
     * @param {string} text
     */
    function saveTextFile(file, text) {  // OK
      try {
        if (!text.trim()) return;
  
        const parentFolder = getParentFolderSafe(file);
        if (!parentFolder) return;
  
        const baseName = file.getName().replace(/\.[^\.]+$/, '');
        const txtFileName = baseName + '.txt';
  
        if (parentFolder.getFilesByName(txtFileName).hasNext()) return;
  
        const txtBlob = Utilities.newBlob(text, 'text/plain', txtFileName);
        parentFolder.createFile(txtBlob);
  
        Logger.log(`✅ Zapisano plik .txt: ${txtFileName}`);
      } catch (e) {
        Logger.log(`❌ Błąd zapisu .txt: ${e.message}`);
      }
    }