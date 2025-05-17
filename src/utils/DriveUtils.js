const DriveUtils = (() => {

    function getAllFilesRecursively(folder) {
      let out = [];
      const files = folder.getFiles();
      while (files.hasNext()) out.push(files.next());
      const sub = folder.getFolders();
      while (sub.hasNext()) out = out.concat(getAllFilesRecursively(sub.next()));
      return out;
    }
  
    function saveTextFile(file, text) {
      // ... save logic ...
    }
  
    function saveMetadataFile(file, metadata) {
      // ... save logic ...
    }
  
    return { 
      getAllFilesRecursively, 
      saveTextFile, 
      saveMetadataFile };
  })();