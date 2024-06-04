import {
    GENERATE_COMMIT_MSG
} from '../constants.js';
import type { Agent, LLMResponseType } from '../types.js';

import { parseCode } from '../utils/code-parsing.js';
import { gitCommit } from '../utils/git/commit.js';
import { getGitDiff } from '../utils/git/diff.js';


export const generateCommitMessages = (folderPath: string): Agent => {
    return {
        name: 'Generate Commit Messages',
        rootDir: folderPath,
        buildPrompt: async () => {
            const responseType: LLMResponseType = 'application/json';
            let prompt = ``;
            prompt += GENERATE_COMMIT_MSG;
            prompt += `\n\n\n`;
            prompt += getGitDiff();
            return { responseType, prompt };
        },
        handleResponse: async (context) => {
            const rawJson = parseCode(context.response, 'json');
            const commitMessages = JSON.parse(rawJson);

            const answers = await context.ask([
                {
                    type: 'list',
                    name: 'action',
                    message: 'Choose the commit message to apply',
                    choices: commitMessages?.map((msg) => ({
                        name: msg.commit,
                        value: msg.commit
                    })),
                    default: 'send',
                }
            ]);

            const commitMsg = commitMessages?.find((msg) => msg.commit === answers.action);
            gitCommit(commitMsg.commit, commitMsg.description);
        }
    };
};