// import editor from '@inquirer/editor';
import {
    DEFAULT_PRE_PROMPT,
    SUGGEST_THINGS
} from '../constants.js';
import { getDirectoryContent } from '../llm.js';
import type { Agent, LLMResponseType } from '../types.js';

import { parseCode } from '../utils/code-parsing.js';

export const suggestThings = (folderPath: string): Agent => {
    return {
        name: 'Suggest Things',
        buildPrompt: async () => {
            const responseType = 'application/json';
            let prompt = ``;
            prompt += getDirectoryContent(folderPath);
            prompt += `\n\n\n`;
            prompt += SUGGEST_THINGS;
            return { responseType, prompt };
        },
        handleResponse: async (context) => {
            const rawJson = parseCode(context.lastResponse, 'json');
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
