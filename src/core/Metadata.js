// src/core/Metadata.js

var Metadata = (function() {
  // Importy (przypisz prawidłowe ścieżki do swoich utili)
  // var getParentFolderSafe = FileUtils.getParentFolderSafe;
  // var computeFileHash = FileUtils.computeFileHash;
  // var detectLanguage = TextUtils.detectLanguage;
  // var inferTitle = TextUtils.inferTitle;
  // var extractSections = TextUtils.extractSections;

  /**
   * Zwraca dane projektu na podstawie ścieżki pliku.
   * Zakłada, że folder projektu ma nazwę np. "Mickiewicza12-Wałbrzych-Altimi".
   */
  function extractProjectInfo(file) {
  try {
    var parents = [];
    var currentFolder = getParentFolderSafe(file);

    while (currentFolder) {
      parents.unshift(currentFolder);
      var parentIterator = currentFolder.getParents();
      currentFolder = parentIterator.hasNext() ? parentIterator.next() : null;
    }

    var projectFolder = null;
    for (var i = 0; i < parents.length; i++) {
      if (parents[i].getName().toLowerCase().includes('to-archive')) {
        if (i + 1 < parents.length) {
          projectFolder = parents[i + 1];
        }
        break;
      }
    }
    if (!projectFolder && parents.length > 0) {
      projectFolder = parents[parents.length - 1];
    }

    var folderName = projectFolder ? projectFolder.getName() : '';
    var parts = folderName.split('-');

    var location = '';
    var projectName = '';
    var customer = '';

    if (parts.length === 3) {
      location = parts[0] + ' ' + parts[1];
      customer = parts[2];
      projectName = '';
    } else if (parts.length === 2) {
      location = parts[0];
      customer = parts[1];
    } else {
      location = folderName;
      customer = '';
    }

    return {
      projectName: projectName,
      location: location,
      customer: customer
    };

  } catch (e) {
    Logger.log("❌ extractProjectInfo: " + e.message);
    return {
      projectName: "",
      location: "",
      customer: ""
    };
  }
}


  /**
   * Tworzy obiekt metadata.json dla pliku
   * @param {File} file - plik źródłowy
   * @param {string} text - wyciągnięty tekst z pliku
   * @returns {object}
   */
  function createMetadataJson(file, text) {
    // 1. Dane projektu z folderu nadrzędnego
    var projectInfo = extractProjectInfo(file);

    // 2. Ustalenie typu pliku
    var parentFolder = getParentFolderSafe(file);
    var baseName = file.getName().replace(/\.[^\.]+$/, "");
    var possibleExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'];
    var sourceFile = null;
    var sourceMimeType = "";
    var fileType = "unknown";
    for (var i = 0; i < possibleExtensions.length; i++) {
      var ext = possibleExtensions[i];
      var matches = parentFolder.getFilesByName(baseName + "." + ext);
      if (matches.hasNext()) {
        sourceFile = matches.next();
        sourceMimeType = sourceFile.getMimeType();
        break;
      }
    }
    if (!sourceFile) sourceFile = file;

    if (sourceMimeType.indexOf('image') !== -1) fileType = 'image';
    else if (sourceMimeType.indexOf('pdf') !== -1) fileType = 'pdf';
    else if (sourceMimeType.indexOf('excel') !== -1 || sourceMimeType.indexOf('spreadsheet') !== -1) fileType = 'excel';
    else if (sourceMimeType.indexOf('word') !== -1) fileType = 'doc';
    else fileType = 'text';

    // 3. Tworzenie szablonu metadanych (najpierw lokalnie, potem merge z AI)
    var metadata = {
      fileName: file.getName(),
      fileType: fileType,
      sourceFileName: sourceFile.getName(),
      sourceMimeType: sourceMimeType,
      project: {
        projectName: projectInfo.projectName, // tu możesz podstawić własną logikę np. "SzkołaAtla"
        location: projectInfo.location,
        customer: projectInfo.customer
      },
      document: {
        title: "",
        sections: "",
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
        rawText: text.length <= 10000 ? text : "",
        summary: "",
        keywords: [],
        keywordSynonyms: {},
        language: ""          //detectLanguage(text) || "pl"
      },
      meta: {
        source: "drive_upload",
        ocrConfidence: 0.95,
        textLength: text.length,
        generatedAt: (new Date()).toISOString(),
        tags: [],
        documentHash: "" // computeFileHash(file) jeśli chcesz
      }
    };

    // --- Miejsce na dopełnienie pol przez AI (analogicznie jak w poprzednim przykładzie) ---
    // var aiResult = callOpenAIForMetadataFields(text, { ... });
    // if (aiResult) { ... merge ... }

    return metadata;
  }

  return {
    createMetadataJson: createMetadataJson
  };
})();





// STARE PODEJŚCIE :

// // Metadata.js – generowanie struktury metadata.json z pliku tekstowego i źródłowego

//     /**
//    * Generuje metadata.json z tekstu i pliku źródłowego
//    * @param {File} file - plik źródłowy
//    * @param {string} text - przetworzony tekst
//    * @returns {Object} - obiekt metadanych
//    */
//     function generateMetadata(file, text) {
//       const parentFolder = getParentFolderSafe(file);
//       const baseName = file.getName().replace(/\.txt$/, "");
//       const possibleExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'];
//       let sourceFile = null;
//       let sourceMimeType = "";
//       let fileType = "unknown";
  
//       for (let ext of possibleExtensions) {
//         const matches = parentFolder.getFilesByName(`${baseName}.${ext}`);
//         if (matches.hasNext()) {
//           sourceFile = matches.next();
//           sourceMimeType = sourceFile.getMimeType();
//           break;
//         }
//       }
  
//       if (!sourceFile) {
//         Logger.log(`⚠️ Nie znaleziono źródłowego pliku dla ${file.getName()}`);
//       }
  
//       if (sourceMimeType.includes('image')) fileType = 'image';
//       else if (sourceMimeType.includes('pdf')) fileType = 'pdf';
//       else if (sourceMimeType.includes('excel') || sourceMimeType.includes('spreadsheet')) fileType = 'excel';
//       else if (sourceMimeType.includes('word')) fileType = 'doc';
//       else fileType = 'text';
  
//       const summary = (text.length > 10000) ? summarizeText(text) : "";
//       const rawText = (text.length <= 10000) ? text : "";
//       const language = detectLanguage(text);
//       const keywords = extractKeywords(text);
//       const tags = autoTag(summary || rawText);
  
//       return {
//         fileName: file.getName(),
//         fileType,
//         documentType,
//         sourceFileName: sourceFile ? sourceFile.getName() : "",
//         sourceMimeType,
//         project: {
//           projectName: "",
//           location: "",
//           date: "",
//           stage: ""
//         },
//         document: {
//           title: inferTitle(text),
//           sections: [],
//           authors: [],
//           createdDate: "",
//           modifiedDate: ""
//         },
//         communication: {
//           participants: [],
//           conversationDate: "",
//           topic: "",
//           conclusions: "",
//           attachment: []
//         },
//         textData: {
//           rawText,
//           summary,
//           keywords,
//           keywordSynonyms: generateSynonyms(keywords),
//           language
//         },
//         meta: {
//           source: "drive_upload",
//           ocrConfidence: 0.95,
//           textLength: text.length,
//           generatedAt: new Date().toISOString(),
//           tags: []
//         }
//       };
//     }
  
  
//   // dobry? NIE