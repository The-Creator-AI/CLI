import { DIFF_PATCH_FILE } from './constants';
import * as fs from 'fs';
import {
  copyOutputToClipboard} from './utils';
import {
  initializeOutputFile,
  processPath,
  processPostPrompt,
  processPrePrompt,
} from './llm';
import { saveLLMResponse, sendToLLM } from './remote';
import { applyDiff, parseDiff } from './diff';

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
  console.log('Response:', response);
  const diff = parseDiff(response);
  console.log('Diff:', diff);
  
  // Write diff to diff.patch file
  fs.writeFileSync(DIFF_PATCH_FILE, diff);
  console.log(`Diff written to ${DIFF_PATCH_FILE} file!`);

  // Apply diff
  applyDiff(diff);
  console.log('Diff applied!');
  
  return 'Done'
})();
