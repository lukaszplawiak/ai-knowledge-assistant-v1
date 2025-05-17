const AutoTagger = (() => {
    function autoTag(text) {
      const prompt = `Wygeneruj tagi dla: ${text}`;
      return callOpenAI(prompt);
    }
    function callOpenAI(prompt) {
      // ... OpenAI call logic ...
      return ['tag1', 'tag2'];
    }
    return { autoTag };
  })();