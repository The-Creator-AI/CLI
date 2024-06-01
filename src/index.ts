import * as fs from 'fs';
import inquirer from 'inquirer';
import { DIFF_PATCH_FILE } from './constants.js';
import { applyDiff } from './diff.js';
import {
  runPrompt,
} from './remote.js';
import { promptConfigs } from './prompt-configs.js';

// Function to handle the main execution flow
const main = async () => {
  const answers = await inquirer.prompt([
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
          name: 'Custom prompt',
          value: 'custom-prompt',
        },
        {
          name: 'Send prompt from prompt.llm with entire repo context',
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
        {
          name: 'Suggest things that I can do',
          value: 'suggest-things',
        },
      ],
      default: 'send',
    }
  ] as inquirer.Question[]);

  const folderPath = answers.folderPath;
  const action = answers.action;

  if (action === 'custom-prompt') {
    await runPrompt(promptConfigs.customPrompt(folderPath));
  }
  // Handle LLM interaction, apply diff, and handle validation
  else if (action === 'send') {
    // await handleLLMInteraction(folderPath);
  } else if (action === 'apply-last-diff') {
    // Apply diff directly if `--applyLast` flag is provided
    console.log(`Reading diff from ${DIFF_PATCH_FILE}`);
    const diff = fs.readFileSync(DIFF_PATCH_FILE).toString();
    // Apply diff
    console.log('Applying diff...');
    await applyDiff(diff);
    console.log('Diff applied!');
  } else if (action === 'commit-message') {
    await runPrompt(promptConfigs.generateCommitMessages(folderPath));
  } else if (action === 'suggest-things') {
    await runPrompt(promptConfigs.suggestThings(folderPath));
  }

  return 'Done';
};

main();
