/**
 * Wywołuje OpenAI GPT (chat/completions) z bezpiecznie przechowywanym kluczem API.
 * @param {string} prompt - Prompt, czyli polecenia i tekst do przetworzenia.
 * @param {number} maxTokens - Maksymalna liczba tokenów w odpowiedzi (np. 1500).
 * @returns {string} - Treść odpowiedzi (content z odpowiedzi API OpenAI).
 */
function callOpenAIChatGPT(prompt, maxTokens) {
  // 1. Pobranie bezpiecznie przechowywanego API Key z PropertiesService
  const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('Brak ustawionego API Key w Script Properties! Dodaj OPENAI_API_KEY w ustawieniach projektu.');
  }

  // 2. Składamy zapytanie POST zgodne z API OpenAI
  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: 'gpt-4.1-nano-2025-04-14', // lub inny model, np. 'gpt-3.5-turbo' gpt-4-turbo gpt-4-1106-nano
    messages: [
      { role: 'system', content: 'Jesteś ekspertem od metadanych dokumentów, Twoim zadaniem jest generowanie metadanych na podstawie tekstów.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    max_tokens: maxTokens || 3500
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // żeby nie przerwać działania przy błędzie (złapiesz sam w try/catch)
  };

  // 3. Wywołanie API i obsługa odpowiedzi
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    if (result.error) {
      throw new Error('OpenAI API error: ' + result.error.message);
    }
    return result.choices[0].message.content;
  } catch (e) {
    Logger.log('❌ Błąd wywołania OpenAI API: ' + e.message);
    throw e;
  }
}
