  
    /**
     * Skraca tekst do streszczenia (np. na potrzeby tagowania).
     */
    function summarizeText(text, maxLength = 500) {
      const plain = text.replace(/\s+/g, ' ').trim();
      return plain.substring(0, maxLength) + (plain.length > maxLength ? '...' : '');
    }
  