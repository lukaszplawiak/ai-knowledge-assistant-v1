

    function getAllFilesRecursively(folder) {
      let out = [];
      const files = folder.getFiles();
      while (files.hasNext()) out.push(files.next());
      const sub = folder.getFolders();
      while (sub.hasNext()) out = out.concat(getAllFilesRecursively(sub.next()));
      return out;
    }
  
    