  
    // function nightlyArchiver() {
    //   const SOURCE_FOLDER_ID = 'ID_TO_ARCHIVE';
    //   const DESTINATION_FOLDER_ID = 'ID_ARCHIVED';
  
    //   const sourceFolder = DriveApp.getFolderById(SOURCE_FOLDER_ID);
    //   const destinationFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);
  
    //   Logger.log('🔵 Start: Budowanie struktury folderów...');
    //   buildFolderStructure(sourceFolder, destinationFolder);
    //   Logger.log('✅ Struktura folderów utworzona.');
  
    //   Logger.log('🔵 Start: Kopiowanie plików i czyszczenie...');
    //   copyFilesAndCleanup(sourceFolder, destinationFolder);
    //   Logger.log('✅ Pliki skopiowane i usunięte.');
    // }
  
    function weeklyArchiver() {
      const SOURCE_FOLDER_ID = '19WgNzF9RPZY_clB5mzZpVbzp61KfbVOt';
      const DESTINATION_FOLDER_ID = '1X4a4gLjKU6fTHNlx0b7EDgZK0_8-ttwk';
  
      const sourceFolder = DriveApp.getFolderById(SOURCE_FOLDER_ID);
      const destinationFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);
  
      Logger.log('🔵 START: Synchronizacja tygodniowa');
      try {
        Logger.log('📁 Buduję strukturę folderów...');
        buildFolderStructure(sourceFolder, destinationFolder);
  
        Logger.log('📄 Rozpoczynam kopiowanie plików...');
        copyFilesAndCleanupWithPagination(sourceFolder, destinationFolder);
  
      } catch (e) {
        Logger.log(`❌ Błąd krytyczny synchronizacji: ${e.message}\n${e.stack}`);
      }
      Logger.log('🔚 KONIEC: Synchronizacja tygodniowa');
    }
  