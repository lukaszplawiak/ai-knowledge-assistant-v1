/**
 * Buduje prompt do ChatGPT na podstawie częściowo uzupełnionego szablonu metadata.json
 * @param {object} localMetadata - Szablon metadanych z uzupełnionymi danymi systemowymi
 * @param {string} text - Pełny tekst dokumentu do analizy
 */
function buildMetadataPrompt(localMetadata, text) {
  var jsonForAI = JSON.parse(JSON.stringify(localMetadata)); // deep copy

  // Pola do uzupełnienia przez AI - czyszczone!
  jsonForAI.document.title = "";
  jsonForAI.document.sections = "";
  jsonForAI.document.authors = [];
  jsonForAI.document.createdDate = "";
  // summary i keywords mogą być generowane przez AI na podstawie tekstu
  if (text.length > 10000) {
    jsonForAI.textData.rawText = ""; // przekazujemy puste (AI tylko summary)
  }
  jsonForAI.textData.summary = "";
  jsonForAI.textData.keywords = [];
  jsonForAI.textData.keywordSynonyms = {};
  // Język opcjonalnie - jeśli masz już lokalną detekcję, możesz nie czyścić

  // Komunikat dla AI (prompt):
  var prompt = `
Uzupełnij brakujące lub puste pola w poniższym obiekcie metadata.json na podstawie przekazanego tekstu dokumentu.
Wypełnij TYLKO te pola, które są puste lub zerowe:
- document.title: znajdź tytuł dokumentu, jeśli nie istnieje w tekście, wygeneruj najbardziej adekwatny do treści tytuł;
- document.sections: znajdź sekcje dokumentu, jeśli nie są jawne, wskaż logiczne sekcje wywnioskowane z tekstu;
- document.authors: podaj autora(ów) jeśli znajdziesz, w przeciwnym wypadku wpisz brak;
- document.createdDate: podaj datę utworzenia jeśli widoczna, w przeciwnym razie wpisz brak;
- textData.summary: wygeneruj syntetyczne podsumowanie dokumentu (zawierające kluczowe informacje);
- textData.keywords: znajdź 5 słów kluczowych najważniejszych dla treści;
- textData.keywordSynonyms: dla każdego słowa kluczowego podaj do 3 kontekstowych synonimów lub najczęstsze odmiany słowa kluczowego;

WAŻNE:

- Nie zmieniaj innych pól w obiekcie! Jeśli pole jest już wypełnione, pozostaw je bez zmian.
- Odpowiedz **tylko** poprawnym, parsowalnym JSON-em.
- Jeśli nie możesz znaleźć danej informacji, pozostaw pole puste lub jako brak (zgodnie z szablonem poniżej).
- Nie zmieniaj struktury kluczy i kolejności pól.

I NAJWAŻNIEJSZE ! : NIE używaj bloków \`\`\`json ani żadnych bloków markdown. NIE otaczaj odpowiedzi blokiem markdown, NIE dodawaj żadnych znaków przed i po JSON. Twoja odpowiedź ma być TYLKO czystym I POPRAWNYM JSON-em.

Oto szablon metadata.json do uzupełnienia:
---
${JSON.stringify(jsonForAI, null, 2)}
---

Oto tekst dokumentu do analizy:
---
${text}
---
`;
  return prompt;
}
