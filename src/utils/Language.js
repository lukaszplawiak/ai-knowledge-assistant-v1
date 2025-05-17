// Language.js – Detekcja języka dokumentu
const Language = (() => {
    /**
     * Detekuje język na podstawie pierwszych 150 znaków.
     * @param {string} text - pełny tekst dokumentu
     * @returns {string} kod języka, np. 'pl', 'en', lub 'unknown'
     */
    function detectLanguage(text) {
      const sample = (text || '').substring(0, 150).trim();
      if (!sample) return "unknown";
  
      try {
        const detected = LanguageApp.detectLanguage(sample);
        Logger.log(`🌐 Wykryto język (150 znaków): ${detected}`);
        return detected;
      } catch (e) {
        Logger.log(`❌ Błąd detekcji języka: ${e.message}`);
        return "unknown";
      }
    }
  
    return { detectLanguage };
  })();