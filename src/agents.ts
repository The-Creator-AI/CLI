// import editor from '@inquirer/editor';
import inquirer from 'inquirer';
import PressToContinuePrompt from 'inquirer-press-to-continue';

import { architect } from './agents/architect.js';
import { codeDiff } from './agents/code-diff.js';
import { codeSpec } from './agents/code-spec.js';
import { generateCommitMessages } from './agents/commit-message.agent.js';
import { runAndFix } from './agents/run-and-fix.js';
import { suggestThings } from './agents/suggest-things.agent.js';

inquirer.registerPrompt('press-to-continue', PressToContinuePrompt);

export const agents = {
    architect,
    runAndFix,
    codeSpec,
    codeDiff,
    suggestThings,
    generateCommitMessages
};
