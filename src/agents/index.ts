// import editor from '@inquirer/editor';
import inquirer from 'inquirer';
import PressToContinuePrompt from 'inquirer-press-to-continue';

import { architect } from './architect.js';
import { codeDiff } from './code-diff.js';
import { codeSpec } from './code-spec.js';
import { generateCommitMessages } from './commit-message.agent.js';
import { runAndFix } from './run-and-fix.js';
import { suggestThings } from './suggest-things.agent.js';

inquirer.registerPrompt('press-to-continue', PressToContinuePrompt);

export const agents = {
    architect,
    runAndFix,
    codeSpec,
    codeDiff,
    suggestThings,
    generateCommitMessages
};
