import * as fs from 'fs';
import { DIFF_PATCH_FILE } from './constants';
import { prompt, Question } from 'inquirer';
import { applyDiff } from './diff';
import {
  initializeOutputFile,
  processDirectory,
  processPostPrompt,
  processPrePrompt
} from './llm';
import {
  generateCommitMessages,
  handleLLMInteraction
} from './remote';
import {
  copyOutputToClipboard,
  writeEmptyLines
} from './utils';

// Function to handle the main execution flow
const main = async () => {
  const answers = await prompt([
    {
      type: 'input',
      name: 'folderPath',
      message: 'Enter the path to the folder containing your project:',
      default: process.cwd(),
    },
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: [
        {
          name: 'Send to LLM',
          value: 'send',
        },
        {
          name: 'Apply last diff',
          value: 'apply-last-diff',
        },
        {
          name: 'Generate commit message',
          value: 'commit-message',
        },
      ],
      default: 'send',
    }
  ] as Question[]);

  const folderPath = answers.folderPath;
  const action = answers.action;

  // Initialize the output file
  const outputFile = initializeOutputFile(folderPath);
  console.log(`Working with folder: ${folderPath}`);
  if (!fs.existsSync(folderPath)) {
    console.error(`Error: Path '${folderPath}' does not exist.`);
    return;
  }


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
  if (action === 'send') {
    await handleLLMInteraction(outputFile);
  } else if (action === 'apply-last-diff') {
    // Apply diff directly if `--applyLast` flag is provided
    console.log(`Reading diff from ${DIFF_PATCH_FILE}`);
    const diff = fs.readFileSync(DIFF_PATCH_FILE).toString();
    // Apply diff
    console.log('Applying diff...');
    applyDiff(diff);
    console.log('Diff applied!');
  } else if (action === 'commit-message') {
    generateCommitMessages();
  }

  return 'Done';
};

main();
