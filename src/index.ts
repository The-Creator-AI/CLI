import readline from 'readline';
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
import { requestBetterDiff, requestCompleteDiff, saveLLMResponse, sendToLLM } from './remote';
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
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let retryCount = 0;
    const response = await sendToLLM(outputFile);
    while (retryCount < 3) {
      try {
        diff = parseDiff(response);
        saveLLMResponse(response);

        // Write diff to diff.patch file
        fs.writeFileSync(DIFF_PATCH_FILE, diff);
        console.log(`Diff written to ${DIFF_PATCH_FILE} file!`);

        // Apply diff
        applyDiff(diff);
        console.log('Diff applied!');
        
        rl.question("Is the diff correct? (yes/no) ", async (answer) => {
          if (answer.toLowerCase() === 'yes') {
            rl.question("Is the diff complete? (yes/no) ", async (answer) => {
              if (answer.toLowerCase() === 'yes') {
                rl.close();
              } else if (answer.toLowerCase() === 'no') {
                console.log('Sending the prompt again for complete diff.');
                await requestCompleteDiff(outputFile);
                retryCount = 0;
              } else {
                console.log('Invalid input. Please enter "yes" or "no".');
              }
            });
          } else if (answer.toLowerCase() === 'no') {
            console.log('Sending the prompt again for better diff.');
            await requestBetterDiff(outputFile);
            retryCount = 0;
          } else {
            console.log('Invalid input. Please enter "yes" or "no".');
          }
        });
        break;
      } catch (error) {
        retryCount++;
        console.log('Diff parsing failed, retrying...');
        if (retryCount == 3) {
          console.log('Diff parsing failed 3 times, exiting...');
        }
      }
    }
  } else {
    // Write diff to diff.patch file
    fs.writeFileSync(DIFF_PATCH_FILE, diff);
    console.log(`Diff written to ${DIFF_PATCH_FILE} file!`);

    // Apply diff
    applyDiff(diff);
    console.log('Diff applied!');
  }

  return 'Done'
})();
