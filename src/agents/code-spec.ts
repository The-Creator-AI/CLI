import autocomplete from 'inquirer-autocomplete-standalone';
import {
    POST_PROMPTS_FILE,
    TECH_SPEC_PROMPT
} from '../constants.js';
import type { Agent, LLMResponseType } from '../types.js';
import {
    getPreviousRecords,
    saveNewRecord
} from '../utils.js';
import { getDirectoryContent } from '../llm.js';

export const codeSpec = (folderPath: string): Agent => {
    return {
        name: 'Code Spec',
        buildPrompt: async (context) => {
            const responseType: LLMResponseType = 'text/plain';
            let prompt = ``;
            prompt += getDirectoryContent(folderPath);
            prompt += `\n\n\n`;
            prompt += TECH_SPEC_PROMPT;
            prompt += `\n\n\n`;
            prompt += context.chatSoFar;
            prompt += `\n\n\n`;
            const postPrompt: string = await autocomplete({
                message: 'What spec would you like to create/update?',
                source: async (input) => {
                    const prompts = getPreviousRecords(POST_PROMPTS_FILE);
                    const filteredPrompts = prompts.filter((prompt) => prompt.includes(input || ''));
                    return [
                        ...(filteredPrompts.map((prompt) => ({
                            value: prompt,
                            description: prompt
                        })) || []),
                        ...(input ? [{ value: input, description: input }] : [])
                    ];
                }
            });
            saveNewRecord(POST_PROMPTS_FILE, postPrompt as string);
            prompt += postPrompt.trim();
            return { responseType, prompt, };
        },
        handleResponse: async (context) => {
            context.applyCodeDiff(context);
        }
    };
};
