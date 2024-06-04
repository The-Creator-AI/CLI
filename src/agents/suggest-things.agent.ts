// import editor from '@inquirer/editor';
import {
    DEFAULT_PRE_PROMPT,
    SUGGEST_THINGS
} from '../constants.js';
import type { Agent, LLMResponseType } from '../types.js';

import { parseCode } from '../utils/code-parsing.js';

export const suggestThings = (folderPath: string): Agent => {
    return {
        name: 'Suggest Things',
        rootDir: folderPath,
        buildPrompt: async (context) => {
            const responseType = 'application/json';
            let prompt = ``;
            prompt += context.codeContent;
            prompt += `\n\n\n`;
            prompt += SUGGEST_THINGS;
            return { responseType, prompt };
        },
        handleResponse: async (context) => {
            const rawJson = parseCode(context.response, 'json');
            const suggestions = JSON.parse(rawJson);
            console.log(suggestions);

            const answers = await context.ask([
                {
                    type: 'list',
                    name: 'action',
                    message: 'Choose the suggestion to apply',
                    choices: suggestions?.map((suggestion) => ({
                        name: suggestion,
                        value: suggestion
                    })),
                    default: 'send',
                }
            ]);
            context.runAgent({
                name: 'Code Diff',
                rootDir: folderPath,
                // responseType: 'text/plain',
                buildPrompt: async (_) => {
                    const responseType: LLMResponseType = 'text/plain';
                    let prompt = ``;
                    prompt += DEFAULT_PRE_PROMPT;
                    prompt += answers.action;
                    return { responseType, prompt };
                },
                handleResponse: async (context) => {
                    context.applyCodeDiff(context);
                }
            });
        },
    };
};
