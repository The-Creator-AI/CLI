import inquirer from 'inquirer';
import { DIFF_PATCH_FILE, OUTPUT_FILE } from './constants.js';
import {
  readLastCodeBlock,
  runAgent,
} from './remote.js';
import { agents } from './agents.js';
import { getDirectoryContent } from './llm.js';
import * as fs from 'fs';
import { openFile } from './utils.js';
import { applyDiff } from './utils/git/diff/apply-diff.js';
import { parseDiff } from './utils/git/diff/parse-diff.js';

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
        {
          name: 'Get code content',
          value: 'get-code-content'
        },
        ...Object.entries(agents).map(([key, value]) => ({
          name: value(folderPath).name,
          value: key,
        }))
      ],
      default: 'send',
  });

  if (action === 'apply-last-diff') {
    console.log(`Reading diff from ${DIFF_PATCH_FILE}`);
    const diff = readLastCodeBlock();
    console.log('Applying diff...');
    await applyDiff(parseDiff(diff));
    console.log('Diff applied!');
  } if (action === 'get-code-content') {
    const codeContent = getDirectoryContent(folderPath)
    fs.writeFileSync(OUTPUT_FILE, codeContent);
    openFile(OUTPUT_FILE);
  } else {
    console.log(`Running prompt for ${action}`);
    await runAgent(agents[action](folderPath));
  }

  return 'Done';
};

main();
