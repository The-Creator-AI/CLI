import editor from '@inquirer/editor';
import autocomplete from 'inquirer-autocomplete-standalone';
import {
    DEFAULT_PRE_PROMPT,
    GENERATE_COMMIT_MSG,
    POST_PROMPTS_FILE,
    PRE_PROMPT_FILE,
    SUGGEST_THINGS
} from './constants.js';
import type { PromptConfig } from './types.js';
import {
    getGitDiff,
    getPreviousRecords,
    gitCommit,
    saveNewRecord
} from './utils.js';
import { saveCodeBlock, saveLLMResponse } from './remote.js';
import { parseCode } from './diff.js';


export const promptConfigs = {
    customPrompt: (folderPath: string) => {
        return {
            rootDir: folderPath,
            responseType: 'text/plain',
            prePrompt: async () => {
                // Initialize the output file
                const sysInstruction: string = await autocomplete({
                    message: 'Please provide system instructions or choose from the list',
                    source: async (input) => {
                        const prompts = getPreviousRecords(PRE_PROMPT_FILE);
                        const instructions = prompts.filter((prompt) => prompt.includes(input || ''));
                        if (instructions.length === 0) {
                            instructions.push(DEFAULT_PRE_PROMPT);
                        }
                        return [
                            ...(instructions.map((instruction) => ({
                                value: instruction,
                                description: instruction
                            }))),
                            ...(input ? [{ value: input, description: input }] : [])
                        ];
                    }
                });
                if (!sysInstruction) {
                    console.error(`You didn't provide a valid prompt!`);
                    return ``;
                }
                process.env['EDITOR'] = 'code';
                const sysInstructionEdited = await editor({
                    message: 'Please choose a system instruction',
                    default: sysInstruction as string
                });
                saveNewRecord(PRE_PROMPT_FILE, sysInstructionEdited);
                return sysInstructionEdited;
            },
            processContent: async (context) => {
                return context.codeContent;
            },
            postPrompt: async () => {
                const postPrompt: string = await autocomplete({
                    message: 'Please provide a custom prompts or choose from the list',
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
                return postPrompt.trim();
            },
            handleResponse: async (llmResponse, context) => {
                saveLLMResponse(llmResponse);
                try {
                    const diff = await context.getCodeBlockFromResponse(llmResponse);
                    saveCodeBlock(diff);
                    context.applyCodeDiff(diff);
                } catch (error) {
                    console.error(`Oops! Couldn't apply code diff!`);
                }
            }
        } as PromptConfig;
    },
    suggestThings: (folderPath: string) => {
        return {
            rootDir: folderPath,
            responseType: 'text/plain',
            prePrompt: async () => {
                return '';
            },
            processContent: async (context) => context.codeContent,
            postPrompt: async () => {
                return SUGGEST_THINGS;
            },
            handleResponse: async (llmResponse, { ask, runPrompt }) => {
                saveLLMResponse(llmResponse);

                const rawJson  = parseCode(llmResponse, 'json');
                const suggestions = JSON.parse(rawJson);
                console.log(suggestions);

                const answers = await ask([
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
                runPrompt({
                    rootDir: folderPath,
                    responseType: 'text/plain',
                    prePrompt: async () => DEFAULT_PRE_PROMPT,
                    processContent: async (context) => context.codeContent,
                    postPrompt: () => answers.action,
                    handleResponse: async (llmResponse, context) => {
                        saveLLMResponse(llmResponse);
                        try {
                            const diff = await context.getCodeBlockFromResponse(llmResponse);
                            saveCodeBlock(diff);
                            context.applyCodeDiff(diff);
                        } catch (error) {
                            console.error(`Oops! Couldn't apply code diff!`);
                        }
                    }
                });
            },
        } as PromptConfig;
    },
    generateCommitMessages: (folderPath: string) => {
        return {
            rootDir: folderPath,
            responseType: 'application/json',
            prePrompt: async () => GENERATE_COMMIT_MSG,
            processContent: async () => getGitDiff(),
            postPrompt: async () => '',
            handleResponse: async (llmResponse, { ask }) => {
                saveLLMResponse(llmResponse);

                const rawJson  = parseCode(llmResponse, 'json');
                const commitMessages = JSON.parse(rawJson);

                const answers = await ask([
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
        } as PromptConfig;
    },
};
