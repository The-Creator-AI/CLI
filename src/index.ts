import { DIFF_PATCH_FILE } from './constants';
import * as fs from 'fs';
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
import { applyDiff, parseDiff } from './diff';

// Main execution
// const folderPath = process.argv.length ? process.argv[2] : process.cwd();
const folderPath = process.cwd();

let applyLast = false;
if (process.argv.length && process.argv.includes('--applyLast')) {
  applyLast = true;
}

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
  let diff = fs.readFileSync(DIFF_PATCH_FILE).toString();
  if (!applyLast) {
    let retryCount = 0;
    while (retryCount < 3) {
      const response = await sendToLLM(outputFile);
      try {
        diff = parseDiff(response);
        saveLLMResponse(response);
        break;
      } catch (error) {
        retryCount++;
        console.log('Diff parsing failed, retrying...');
        if (retryCount == 3) {
          console.log('Diff parsing failed 3 times, exiting...');
        }
      }
    }  // Write diff to diff.patch file  fs.writeFileSync(DIFF_PATCH_FILE, diff);
  }

  // Write diff to diff.patch file
  fs.writeFileSync(DIFF_PATCH_FILE, diff);
  console.log(`Diff written to ${DIFF_PATCH_FILE} file!`);

  // Apply diff
  applyDiff(diff);
  console.log('Diff applied!');

  return 'Done'
})();
