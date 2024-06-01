import * as fs from 'fs';
import { DIFF_PATCH_FILE } from './constants';
import { applyDiff } from './diff';
import {
  initializeOutputFile,
  processDirectory,
  processPostPrompt,
  processPrePrompt
} from './llm';
import {
  handleLLMInteraction
} from './remote';
import {
  copyOutputToClipboard,
  writeEmptyLines
} from './utils';

// Function to handle the main execution flow
const main = async () => {
  const folderPath = process.argv.length > 2 ? process.argv[2] : process.cwd();
  const applyLast = process.argv.length > 2 && process.argv.includes('--applyLast');

  // Initialize the output file
  const outputFile = initializeOutputFile(folderPath);

  // Process the pre-prompt
  processPrePrompt(folderPath, outputFile);

  // Process the folder and its contents
  processDirectory(folderPath, outputFile);

  // Process the post-prompt
  processPostPrompt(folderPath, outputFile);
  
  // Append IGNORE_LINE_NUMBERS to the output file
  writeEmptyLines(outputFile);


  // Copy the output file to the clipboard
  copyOutputToClipboard(outputFile);

  // Handle LLM interaction, apply diff, and handle validation
  if (!applyLast) {
    await handleLLMInteraction(outputFile);
  } else {
    // Apply diff directly if `--applyLast` flag is provided
    console.log(`Reading diff from ${DIFF_PATCH_FILE}`);
    const diff = fs.readFileSync(DIFF_PATCH_FILE).toString();
    // Apply diff
    console.log('Applying diff...');
    applyDiff(diff);
    console.log('Diff applied!');
  }

  return 'Done';
};

main();
