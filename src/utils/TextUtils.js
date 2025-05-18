
  /**
   * Sprawdza jakość wyciągniętego tekstu:
   * - długość
   * - liczba liter
   * - stosunek liter do ogólnej liczby znaków
   * - obecność typowych słów
   * @param {string} text
   * @returns {boolean}
   */
  function isValidExtractedText(text, { minLength = 30, allowNumericTables = true } = {}) {
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
  

  /**
   * Tworzy streszczenie z początku tekstu (max 500 znaków)
   * @param {string} text
   * @returns {string}
   */
  function summarizeText(text) {
    return text.substring(0, 500) + '...';
  }

  /**
   * Wyciąga nagłówki-sekcje z tekstu (heurystyka)
   * @param {string} text
   * @returns {string[]}
   */
  function extractSections(text) {
    return text.includes("\n\n") ? text.split(/\n\n+/).slice(0, 5) : [];
  }

  /**
   * Szacuje tytuł dokumentu na podstawie pierwszej linii
   * @param {string} text
   * @returns {string}
   */
  function inferTitle(text) {
    const firstLine = text.split("\n")[0];
    return firstLine.length < 100 ? firstLine : "Dokument bez tytułu";
  }
