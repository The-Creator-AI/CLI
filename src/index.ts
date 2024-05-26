import {
  copyOutputToClipboard,
} from './utils';

import {
  initializeOutputFile,
  processPrePrompt,
  processPath,
  processPostPrompt,
} from './llm';

// Main execution
const folderPath = process.argv.length > 2 ? process.argv[2] : process.cwd();

// Initialize the output file
const outputFile = initializeOutputFile(folderPath);

// Process the pre-prompt
processPrePrompt(folderPath, outputFile);

// Process folder
processPath(folderPath, outputFile);

// Process the post-prompt
processPostPrompt(folderPath, outputFile);

// Copy the output file to clipboard
copyOutputToClipboard(outputFile); // Added this line
