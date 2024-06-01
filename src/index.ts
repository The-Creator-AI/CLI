import * as fs from 'fs';
import { prompt, Question } from 'inquirer';
import { DIFF_PATCH_FILE } from './constants';
import { applyDiff } from './diff';
import {
  generateCommitMessages,
  handleLLMInteraction
} from './remote';

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

  // Handle LLM interaction, apply diff, and handle validation
  if (action === 'send') {
    await handleLLMInteraction(folderPath);
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
