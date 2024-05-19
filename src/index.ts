import { 
    initializeOutputFile,
    processPrePrompt,
    processLine,
    processPostPrompt,
    copyOutputToClipboard,
  } from './file-processor';
  
  // Main execution
  const folderPath = process.argv.length > 2 ? process.argv[2] : process.cwd();
  
  // Initialize the output file
  const outputFile = initializeOutputFile(folderPath);
  
  // Process the pre-prompt
  processPrePrompt(folderPath, outputFile);
  
  // Process folder
  processLine(folderPath, outputFile);
  
  // Process the post-prompt
  processPostPrompt(folderPath, outputFile);
  
  // Copy the output file to clipboard
  copyOutputToClipboard(outputFile); // Added this line
  