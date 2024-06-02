import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import {
    BETTERS_DIFF_REQUEST, COMPLETE_DIFF_REQUEST,
    DIFF_PATCH_FILE,
    LLM_RESPONSE_FILE,
    OUTPUT_FILE
} from './constants.js';
import { applyDiff, parseCode } from './diff.js';
import { getDirectoryContent } from './llm.js';
import type { PromptConfig, PromptConfigContext } from './types.js';
import {
    copyOutputToClipboard,
    openFile,
    readFileContent,
    resetUnstagedFiles
} from './utils.js';

// global fetch
(global as any).fetch = fetch;
// global.Headers = fetch.Headers;
(global as any).Headers = (fetch as any).Headers;
// global.Request = fetch.Request;
(global as any).Request = (fetch as any).Request;
// global.Response = fetch.Response;
(global as any).Response = (fetch as any).Response;


export const sendToLLM = async (prompt: string, options?: {
    responseType: 'text/plain' | 'application/json'
}) => {
    const { responseType = 'text/plain' } = options || {};

    // Get your API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Please set the GEMINI_API_KEY environment variable.');
    }

    // Initialize Gemini client and get the model
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent({
        contents: [{
            role: 'user',
            parts: [{
                text: prompt
            }],
        }],
        generationConfig: {
            responseMimeType: responseType
        }
    });

    // Convert the output to a git diff
    return response.response.text();
};

export const saveLLMPrompt = async (response: string) => {
    fs.writeFileSync(OUTPUT_FILE, response);
};

export const saveLLMResponse = async (response: string) => {
    fs.writeFileSync(LLM_RESPONSE_FILE, response);
};

export const saveCodeBlock = async (code: string) => {
    fs.writeFileSync(DIFF_PATCH_FILE, code);
    console.log(`Diff written to ${DIFF_PATCH_FILE} file!`);
};

export const readLastCodeBlock = () => {
    return readFileContent(DIFF_PATCH_FILE).toString();
};

export const openPatchFile = async () => {
    openFile(DIFF_PATCH_FILE);
};

export const readLastLLMResponse = async () => {
    return readFileContent(LLM_RESPONSE_FILE);
};

export const requestCompleteDiff = async (lastLLMPrompt: string, lastLLMResponse: string) => {
    const { postPrompt } = await inquirer.prompt({
        type: 'input',
        name: 'postPrompt',
        message: 'What should the model be asked to do?',
        default: COMPLETE_DIFF_REQUEST
    });
    const newPrompt = `
    ${lastLLMPrompt}
    \n\n\n\n\n
    Modlel Response:
    \n\n
    ${lastLLMResponse}
    \n\n\n\n\n
    ${postPrompt}
    `;
    saveLLMPrompt(newPrompt);
    const response = await sendToLLM(newPrompt);
    saveLLMResponse(response);
    applyCodeDiff(newPrompt, response);
};

export const requestBetterDiff = async (lastLLMPrompt: string, lastLLMResponse: string) => {
    const { postPrompt } = await inquirer.prompt({
        type: 'input',
        name: 'postPrompt',
        message: 'What should the model be asked to do?',
        default: BETTERS_DIFF_REQUEST
    });
    const newPrompt = `
    ${lastLLMPrompt}
    \n\n\n\n\n
    Modlel Response:
    \n\n
    ${lastLLMResponse}
    \n\n\n\n\n
    ${postPrompt}
    `;
    saveLLMPrompt(newPrompt);
    const response = await sendToLLM(newPrompt);
    saveLLMResponse(response);
    applyCodeDiff(newPrompt, response);
};

const applyCodeDiff = async (llmPrompt: string, llmResponse: string) => {
        try {
            let diff = parseCode(llmResponse, 'diff');
            saveCodeBlock(diff);

            openPatchFile();

            console.log('Appllying diff...');
            applyDiff(diff);
            console.log('Diff applied!');

            const answer = await inquirer.prompt({
                type: 'confirm',
                name: 'isDiffCorrect',
                message: 'Is the diff correct?',
                default: true
            });

            if (!answer.isDiffCorrect) {
                resetUnstagedFiles();
                console.log('Sending the prompt again for better diff.');
                await requestBetterDiff(llmPrompt, llmResponse);
            } else {
                const answer = await inquirer.prompt({
                    type: 'confirm',
                    name: 'isDiffComplete',
                    message: 'Is the diff complete?',
                    default: true
                });
                if (!answer.isDiffComplete) {
                    console.log('Sending the prompt again for complete diff.');
                    await requestCompleteDiff(llmPrompt, llmResponse);
                }
            }

        } catch (error) {
            console.log('Diff parsing failed, retrying...');
            await requestBetterDiff(llmPrompt, llmResponse);
        }
};

// this function will take a prompt config object
// and will implement the prompt and handle response
export const runPrompt = async (promptConfig: PromptConfig, _context?: PromptConfigContext) => {
    const rootDir = promptConfig.rootDir;

    console.info(`Working with folder: ${rootDir}`);

    const context: PromptConfigContext = {
        rootDir,
        ask: async (question: inquirer.Question) => {
            return await inquirer.prompt(question);
        },
        copyToClipboard: (content) => {
            copyOutputToClipboard(content);
        },
        log: (message) => {
            console.log(message);
        },
        applyCodeDiff: async (context) => {
            applyCodeDiff(context.prompt,context.response);
        },
        runPrompt,
        prompt: '',
        response: '',
        ..._context,
        codeContent: getDirectoryContent(rootDir),
    };

    // Process the pre-prompt
    const prePrompt = await promptConfig.prePrompt(context);
    console.info(`Pre-prompt: ${prePrompt}`);
    context.prompt += prePrompt;

    // Process the code content in the rootDir
    const content = await promptConfig.processContent(context);
    // console.info(`Content: ${content}`);
    context.prompt += content;

    // Process the post-prompt
    const postPrompt = await promptConfig.postPrompt(context);
    console.info(`Post-prompt: ${postPrompt}`);
    context.prompt += postPrompt;

    // console.info(`Final prompt: ${finalPrompt}`);
    saveLLMPrompt(context.prompt);

    // Handle response
    context.response = await sendToLLM(context.prompt, {
        responseType: promptConfig.responseType,
    });
    saveLLMResponse(context.response);
    console.info(`LLM response: ${context.response}`);
    await promptConfig.handleResponse(context);
};
