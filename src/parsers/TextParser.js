
    /**
     * Wnioskowanie tytułu na podstawie pierwszej linii.
     * @param {string} text
     * @returns {string}
     */
    function inferTitle(text) {
      const firstLine = text.split('\n')[0];
      return firstLine.length < 100 ? firstLine : 'Dokument bez tytułu';
    }
  
    /**
     * Wyodrębnianie sekcji z tekstu na podstawie pustych linii.
     * @param {string} text
     * @returns {string[]}
     */
    function extractSections(text) {
      return text.includes('\n\n') ? text.split(/\n\n+/).slice(0, 5) : [];
    }
  