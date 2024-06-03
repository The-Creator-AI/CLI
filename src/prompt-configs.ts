// import editor from '@inquirer/editor';
import autocomplete from 'inquirer-autocomplete-standalone';
import {
    DEFAULT_PRE_PROMPT,
    GENERATE_COMMIT_MSG,
    POST_PROMPTS_FILE,
    POST_PROMPT_FILE,
    SUGGEST_THINGS,
    TECH_SPEC_PROMPT
} from './constants.js';
import type { PromptConfig } from './types.js';
import {
    getGitDiff,
    getPreviousRecords,
    gitCommit,
    openFile,
    readFileContent,
    saveNewRecord
} from './utils.js';
import { parseCode } from './diff.js';
import * as child_process from 'child_process';
import PressToContinuePrompt, { KeyDescriptor } from 'inquirer-press-to-continue';
import * as fs from 'fs';
import inquirer from 'inquirer';
inquirer.registerPrompt('press-to-continue', PressToContinuePrompt);

const runAndFix = (folderPath: string): PromptConfig => {
    return {
        label: 'Run and Fix',
        rootDir: folderPath,
        buildPrompt: async (context) => {
            const responseType: 'text/plain' | 'application/json' = 'text/plain';
            let prompt = ``;
            prompt += DEFAULT_PRE_PROMPT;
            prompt += `\n\n\n`;
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
                    prompt += context.codeContent;
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
                context.runPrompt(runAndFix(context.rootDir), context);
            }
        }
    };
};

const codeSpec = (folderPath: string): PromptConfig => {
    return {
        label: 'Code Spec',
        rootDir: folderPath,
        buildPrompt: async (context) => {
            const responseType: 'text/plain' | 'application/json' = 'text/plain';
            let prompt = ``;
            prompt += TECH_SPEC_PROMPT;
            prompt += `\n\n\n`;
            prompt += context.codeContent;
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

const codeDiff = (folderPath: string): PromptConfig => {
    return {
        label: 'Code Diff',
        rootDir: folderPath,
        buildPrompt: async (context) => {
            const responseType: 'text/plain' | 'application/json' = 'text/plain';
            let prompt = ``;
            prompt += TECH_SPEC_PROMPT;
            prompt += `\n\n\n`;
            prompt += context.codeContent;

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

const suggestThings = (folderPath: string): PromptConfig => {
    return {
        label: 'Suggest Things',
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
            context.runPrompt({
                label: 'Code Diff',
                rootDir: folderPath,
                // responseType: 'text/plain',
                buildPrompt: async (_) => {
                    const responseType: 'text/plain' | 'application/json' = 'text/plain';
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

const generateCommitMessages = (folderPath: string): PromptConfig => {
    return {
        label: 'Generate Commit Messages',
        rootDir: folderPath,
        buildPrompt: async () => {
            const responseType: 'text/plain' | 'application/json' = 'application/json';
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

export const promptConfigs = {
    runAndFix,
    codeSpec,
    codeDiff,
    suggestThings,
    generateCommitMessages
};
