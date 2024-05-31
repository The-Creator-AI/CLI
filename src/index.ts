import {
  copyOutputToClipboard
} from './utils';
import {
  initializeOutputFile,
  processPath,
  processPostPrompt,
  processPrePrompt,
} from './llm';
import { saveLLMResponse, sendToLLM } from './remote';

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

(async () => {
  const response = await sendToLLM(outputFile);
  saveLLMResponse(response);
  console.log(response);
})();
