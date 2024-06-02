import inquirer from 'inquirer';
import { DIFF_PATCH_FILE } from './constants.js';
import { applyDiff } from './diff.js';
import {
  readLastCodeBlock,
  runPrompt,
} from './remote.js';
import { promptConfigs } from './prompt-configs.js';

const main = async () => {
  // const { folderPath } = await inquirer.prompt({
  //   type: 'input',
  //   name: 'folderPath',
  //   message: 'Enter the path to the folder containing your project:',
  //   default: process.cwd(),
  // });

  const folderPath = process.cwd();
  console.log(`Running prompts in ${folderPath}`);

  const { action } = await inquirer.prompt(
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: [
        {
          name: 'Apply last diff',
          value: 'apply-last-diff',
        },
        ...Object.entries(promptConfigs).map(([key, value]) => ({
          name: value(folderPath).label,
          value: key,
        }))
      ],
      default: 'send',
  });

  if (action === 'apply-last-diff') {
    console.log(`Reading diff from ${DIFF_PATCH_FILE}`);
    const diff = readLastCodeBlock();
    console.log('Applying diff...');
    await applyDiff(diff);
    console.log('Diff applied!');
  } else {
    console.log(`Running prompt for ${action}`);
    await runPrompt(promptConfigs[action](folderPath));
  }

  return 'Done';
};

main();
