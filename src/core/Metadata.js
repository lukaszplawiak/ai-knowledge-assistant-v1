// Metadata.js – generowanie struktury metadata.json z pliku tekstowego i źródłowego

    /**
   * Generuje metadata.json z tekstu i pliku źródłowego
   * @param {File} file - plik źródłowy
   * @param {string} text - przetworzony tekst
   * @returns {Object} - obiekt metadanych
   */
    function generateMetadata(file, text) {
      const parentFolder = getParentFolderSafe(file);
      const baseName = file.getName().replace(/\.txt$/, "");
      const possibleExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'];
      let sourceFile = null;
      let sourceMimeType = "";
      let fileType = "unknown";
  
      for (let ext of possibleExtensions) {
        const matches = parentFolder.getFilesByName(`${baseName}.${ext}`);
        if (matches.hasNext()) {
          sourceFile = matches.next();
          sourceMimeType = sourceFile.getMimeType();
          break;
        }
      }
  
      if (!sourceFile) {
        Logger.log(`⚠️ Nie znaleziono źródłowego pliku dla ${file.getName()}`);
      }
  
      if (sourceMimeType.includes('image')) fileType = 'image';
      else if (sourceMimeType.includes('pdf')) fileType = 'pdf';
      else if (sourceMimeType.includes('excel') || sourceMimeType.includes('spreadsheet')) fileType = 'excel';
      else if (sourceMimeType.includes('word')) fileType = 'doc';
      else fileType = 'text';
  
      const summary = (text.length > 10000) ? summarizeText(text) : "";
      const rawText = (text.length <= 10000) ? text : "";
      const language = detectLanguage(text);
      const keywords = extractKeywords(text);
      const tags = autoTag(summary || rawText);
  
      return {
        fileName: file.getName(),
        fileType,
        sourceFileName: sourceFile ? sourceFile.getName() : "",
        sourceMimeType,
        project: {
          projectName: "",
          location: "",
          date: "",
          stage: ""
        },
        document: {
          title: inferTitle(text),
          sections: fileType === 'excel' ? extractExcelInsights(sourceFile) : extractSections(text),
          authors: [],
          createdDate: "",
          modifiedDate: ""
        },
        communication: {
          participants: [],
          conversationDate: "",
          topic: "",
          conclusions: "",
          attachment: []
        },
        textData: {
          rawText,
          summary,
          keywords,
          keywordSynonyms: generateSynonyms(keywords),
          language
        },
        meta: {
          source: "drive_upload",
          ocrConfidence: 0.95,
          textLength: text.length,
          generatedAt: new Date().toISOString(),
          tags: []
        }
      };
    }
  
  
  // dobry?