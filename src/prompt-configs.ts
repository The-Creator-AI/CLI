// import editor from '@inquirer/editor';
import autocomplete from 'inquirer-autocomplete-standalone';
import {
    DEFAULT_PRE_PROMPT,
    GENERATE_COMMIT_MSG,
    POST_PROMPTS_FILE,
    SUGGEST_THINGS,
    TECH_SPEC_PROMPT
} from './constants.js';
import type { PromptConfig } from './types.js';
import {
    getGitDiff,
    getPreviousRecords,
    gitCommit,
    saveNewRecord
} from './utils.js';
import { parseCode } from './diff.js';
import * as child_process from 'child_process';


export const promptConfigs = {
    runAndFix: (folderPath: string) => {
        return {
            label: 'Run and Fix',
            rootDir: folderPath,
            responseType: 'text/plain',
            prePrompt: async () => DEFAULT_PRE_PROMPT,
            processContent: async (context) => {
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
                        let output = ``;
                        output += context.codeContent;
                        output += `\n\n\n\n\n\n`;
                        output += `$ ${command}`
                        output += `\n\n`;
                        output += `stdout:`;
                        output += `\n\n`;
                        output += stdout;
                        output += `stderr:`;
                        output += `\n\n`;
                        output += stderr;
                        resolve(output);
                    });
                });
            },
            postPrompt: async () => {
                return 'Now, can you provide the fix for the errors in the output above?';
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
                    context.runPrompt(promptConfigs.runAndFix(context.rootDir), context);
                }
            }
        } as PromptConfig;
    },
    codeSpec: (folderPath: string) => {
        return {
            label: 'Code Spec',
            rootDir: folderPath,
            responseType: 'text/plain',
            prePrompt: async () => TECH_SPEC_PROMPT,
            processContent: async (context) => {
                return context.codeContent;
            },
            postPrompt: async () => {
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
                return postPrompt.trim();
            },
            handleResponse: async (context) => {
                context.applyCodeDiff(context);
            }
        } as PromptConfig;
    },
    codeDiff: (folderPath: string) => {
        return {
            label: 'Code Diff',
            rootDir: folderPath,
            responseType: 'text/plain',
            prePrompt: async () => DEFAULT_PRE_PROMPT,
            processContent: async (context) => {
                return context.codeContent;
            },
            postPrompt: async () => {
                const postPrompt: string = await autocomplete({
                    message: 'What changes would you like to make to the code?',
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
            handleResponse: async (context) => {
                context.applyCodeDiff(context);
            }
        } as PromptConfig;
    },
    suggestThings: (folderPath: string) => {
        return {
            label: 'Suggest Things',
            rootDir: folderPath,
            responseType: 'text/plain',
            prePrompt: async () => {
                return '';
            },
            processContent: async (context) => context.codeContent,
            postPrompt: async () => {
                return SUGGEST_THINGS;
            },
            handleResponse: async (context) => {

                const rawJson  = parseCode(context.response, 'json');
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
                    responseType: 'text/plain',
                    prePrompt: async () => DEFAULT_PRE_PROMPT,
                    processContent: async (context) => context.codeContent,
                    postPrompt: () => answers.action,
                    handleResponse: async (context) => {
                        context.applyCodeDiff(context);
                    }
                });
            },
        } as PromptConfig;
    },
    generateCommitMessages: (folderPath: string) => {
        return {
            label: 'Generate Commit Messages',
            rootDir: folderPath,
            responseType: 'application/json',
            prePrompt: async () => GENERATE_COMMIT_MSG,
            processContent: async () => getGitDiff(),
            postPrompt: async () => '',
            handleResponse: async (context) => {
                const rawJson  = parseCode(context.response, 'json');
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
        } as PromptConfig;
    },
};
