// import editor from '@inquirer/editor';
import * as child_process from 'child_process';
import {
    DEFAULT_PRE_PROMPT
} from '../constants.js';
import type { Agent, LLMResponseType } from '../types.js';
import { getDirectoryContent } from '../llm.js';

export const runAndFix = (folderPath: string): Agent => {
    return {
        name: 'Run and Fix',
        buildPrompt: async (context) => {
            const responseType: LLMResponseType = 'text/plain';
            let prompt = ``;
            if (!context.data) {
                prompt += DEFAULT_PRE_PROMPT;
                prompt += `\n\n\n`;
                prompt += getDirectoryContent(folderPath);
                prompt += `\n\n\n`;
            }
            const { command } = context.data?.runAndFix || await context.ask([{
                type: 'input',
                name: 'command',
                message: 'Enter the command to run:',
                default: 'npm run scrape',
            }]);
            return new Promise((resolve, _) => {
                context.data = {
                    runAndFix: {
                        command,
                    }
                };
                console.log(`Running command: ${command}`);
                child_process.exec(command, (stderr, stdout, _) => {
                    console.log('Command Output: ', stdout);
                    console.log('Command Error: ', stderr);
                    prompt += `\n\n\n\n\n\n`;
                    prompt += `$ ${command}`
                    prompt += `\n\n`;
                    prompt += `stdout:`;
                    prompt += `\n\n`;
                    prompt += stdout;
                    prompt += `stderr:`;
                    prompt += `\n\n`;
                    prompt += stderr;
                    resolve({
                        responseType,
                        prompt,
                    });
                });
            });
        },
        handleResponse: async (context) => {
            context.applyCodeDiff(context);
            const { action } = await context.ask([{
                type: 'list',
                name: 'action',
                message: 'What do you want to do next?',
                choices: [
                    {
                        name: 'Run command again',
                        value: 'run-again'
                    },
                    {
                        name: 'Do something else',
                        value: 'do-something-else'
                    }
                ],
                default: 'send',
            }]);
            if (action === 'run-again') {
                context.runAgent(runAndFix(folderPath), context);
            }
        }
    };
};
