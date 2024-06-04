// import editor from '@inquirer/editor';
import * as fs from 'fs';
import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-standalone';
import { KeyDescriptor } from 'inquirer-press-to-continue';
import {
    POST_PROMPTS_FILE,
    POST_PROMPT_FILE,
    TECH_SPEC_PROMPT
} from '../constants.js';
import type { Agent, LLMResponseType } from '../types.js';
import {
    getPreviousRecords,
    openFile,
    readFileContent,
    saveNewRecord
} from '../utils.js';
import { getDirectoryContent } from '../llm.js';

export const codeDiff = (folderPath: string): Agent => {
    return {
        name: 'Code Diff',
        buildPrompt: async (context) => {
            const responseType: LLMResponseType = 'text/plain';
            let prompt = ``;
            prompt += getDirectoryContent(folderPath);
            prompt += `\n\n\n`;
            prompt += TECH_SPEC_PROMPT;
            prompt += `\n\n\n`;
            prompt += context.chatSoFar;

            const prompts = getPreviousRecords(POST_PROMPTS_FILE);
            let postPrompt: string = await autocomplete({
                message: 'What changes would you like to make to the code?',
                source: async (input) => {
                    const filteredPrompts = prompts.filter((prompt) => prompt.includes(input || ''));
                    return [
                        ...(input ? [] : [{ value: 'Edit in file...', description: 'Edit in file...' }]),
                        ...(filteredPrompts.map((prompt) => ({
                            value: prompt,
                            name: prompt,
                            description: prompt.slice(0, 100)
                        })) || []),
                        ...(input ? [{ value: input, description: input }] : [])
                    ];
                }
            });
            if (postPrompt === 'Edit in file...') {
                console.log('Please put in your prompt in the following file: ', POST_PROMPT_FILE);
                if (prompts?.length > 0) {
                    fs.writeFileSync(POST_PROMPT_FILE, prompts[0]);
                }
                openFile(POST_PROMPT_FILE);
                const { key: _ } = await inquirer.prompt<{ key: KeyDescriptor }>({
                    name: 'key',
                    type: 'press-to-continue',
                    anyKey: true,
                    pressToContinueMessage: 'Press a key to continue...',
                });
                postPrompt = readFileContent(POST_PROMPT_FILE);
            };
            saveNewRecord(POST_PROMPTS_FILE, postPrompt as string);
            prompt += postPrompt.trim();

            return { responseType, prompt };
        },
        handleResponse: async (context) => {
            context.applyCodeDiff(context);
        }
    };
};