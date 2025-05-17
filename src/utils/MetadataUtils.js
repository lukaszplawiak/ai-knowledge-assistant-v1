const MetadataUtils = (() => {
    /**
     * Wyciąga podstawowe słowa kluczowe z tekstu.
     * W wersji produkcyjnej warto zastosować AI lub NLP.
     */
    function extractKeywords(text) {
      const lower = text.toLowerCase();
      const keywords = [];
  
      const terms = ['faktura', 'raport', 'projekt', 'adres', 'budżet', 'kosztorys', 'umowa', 'dokument', 'inwestycja'];
      for (const term of terms) {
        if (lower.includes(term)) keywords.push(term);
      }
  
      return [...new Set(keywords)].slice(0, 10); // unikalne, max 10
    }
  
    /**
     * Generuje słownik synonimów do słów kluczowych.
     */
    function generateSynonyms(keywords) {
      const dict = {
        faktura: ['rachunek', 'rozliczenie'],
        projekt: ['plan', 'inwestycja'],
        kosztorys: ['budżet', 'szacunek'],
        dokument: ['plik', 'materiał'],
        inwestycja: ['realizacja', 'budowa'],
      };
  
      const out = {};
      for (const word of keywords) {
        out[word] = dict[word] || [];
      }
      return out;
    }
  
    /**
     * Przypuszczalnie tytuł dokumentu — pierwsza linia lub nagłówek.
     */
    function inferTitle(text) {
      const firstLine = text.trim().split('\n')[0];
      return firstLine.length <= 100 ? firstLine : 'Dokument bez tytułu';
    }
  
    /**
     * Ekstrakcja głównych sekcji — heurystycznie przez podział na bloki.
     */
    function extractSections(text) {
      return text.split(/\n{2,}/).slice(0, 5).map(section => section.trim()).filter(Boolean);
    }
  
    /**
     * Skraca tekst do streszczenia (np. na potrzeby tagowania).
     */
    function summarizeText(text, maxLength = 500) {
      const plain = text.replace(/\s+/g, ' ').trim();
      return plain.substring(0, maxLength) + (plain.length > maxLength ? '...' : '');
    }
  
    return {
      extractKeywords,
      generateSynonyms,
      inferTitle,
      extractSections,
      summarizeText,
    };
  })();
  