function runBatchOCR() {
    const { batchOCRProcessor } = Processor;
    batchOCRProcessor();
  }
  
  function runWeeklyArchive() {
    const { weeklyArchiver } = Processor;
    weeklyArchiver();
  }
  
  function runNightlyArchive() {
    const { nightlyArchiver } = Processor;
    nightlyArchiver();
  }

  // dobry
  