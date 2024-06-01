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
import { getDirectoryContent, initializeOutputFile, processPostPrompt, processPrePrompt } from './llm.js';
import { promptConfigs } from './prompt-configs.js';
import type { PromptConfig, PromptConfigContext } from './types.js';
import {
    copyOutputToClipboard,
    readFileContent,
    writeEmptyLines
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

export const readLastLLMResponse = async () => {
    return readFileContent(LLM_RESPONSE_FILE);
};

export const requestCompleteDiff = async () => {
    const lastLLMResponse = await readLastLLMResponse();
    const llmPrompt = `
    ${lastLLMResponse}
    \n\n\n\n\n
    ${COMPLETE_DIFF_REQUEST}
    `;
    const response = await sendToLLM(readFileContent(llmPrompt));
    implementLLMDiff(response);
};

export const requestBetterDiff = async () => {
    const lastLLMResponse = await readLastLLMResponse();
    const llmPrompt = `
    ${lastLLMResponse}
    \n\n\n\n\n
    ${BETTERS_DIFF_REQUEST}
    `;
    const response = await sendToLLM(readFileContent(llmPrompt));
    implementLLMDiff(response);
};

// Function to handle the interaction with the LLM and apply the diff
export const handleLLMInteraction = async (folderPath: string) => {
    // Initialize the output file
    const outputFile = initializeOutputFile(folderPath);
    console.log(`Working with folder: ${folderPath}`);
    if (!fs.existsSync(folderPath)) {
        console.error(`Error: Path '${folderPath}' does not exist.`);
        return;
    }

    // Process the pre-prompt
    processPrePrompt(folderPath, outputFile);

    // Process the folder and its contents
    const content = getDirectoryContent(folderPath);
    fs.appendFileSync(outputFile, content);

    // Process the post-prompt
    processPostPrompt(folderPath, outputFile);

    writeEmptyLines(outputFile);

    // Copy the output file to the clipboard
    copyOutputToClipboard(outputFile);

    implementLLMDiff(readFileContent(outputFile));
};

const implementLLMDiff = async (llmPrompt: string) => {
    let retryCount = 0;
    while (retryCount < 3) {

        saveLLMPrompt(llmPrompt);

        const response = await sendToLLM(llmPrompt);
        try {
            let diff = parseCode(response, 'diff');
            retryCount = 0;

            saveLLMResponse(response);

            // Write diff to diff.patch file
            fs.writeFileSync(DIFF_PATCH_FILE, diff);
            console.log(`Diff written to ${DIFF_PATCH_FILE} file!`);

            // Apply diff
            applyDiff(diff);
            console.log('Diff applied!');

            const answer = await inquirer.prompt({
                type: 'confirm',
                name: 'isDiffCorrect',
                message: 'Is the diff correct?',
                default: true
            });

            if (!answer.isDiffCorrect) {
                console.log('Sending the prompt again for better diff.');
                await requestBetterDiff();
            } else {
                const answer = await inquirer.prompt({
                    type: 'confirm',
                    name: 'isDiffComplete',
                    message: 'Is the diff complete?',
                    default: true
                });
                if (!answer.isDiffComplete) {
                    console.log('Sending the prompt again for complete diff.');
                    await requestCompleteDiff();
                }
            }

        } catch (error) {
            retryCount++;
            console.log(`
            Response: \n\n\n\n\n\n
            ${response}
            `);
            console.log('Diff parsing failed, retrying...');
            if (retryCount == 3) {
                console.log('Diff parsing failed 3 times, exiting...');
            }
        }
    }
};

export const generateCommitMessages = async (folderPath: string) => {
    runPrompt(promptConfigs.generateCommitMessages(folderPath));
};

export const suggestThings = async (folderPath: string) => {
    runPrompt(promptConfigs.suggestThings(folderPath));
};

// this function will take a prompt config object
// and will implement the prompt and handle response
export const runPrompt = async (promptConfig: PromptConfig) => {
    const rootDir = promptConfig.rootDir;

    console.info(`Working with folder: ${rootDir}`);

    const context: PromptConfigContext = {
        rootDir,
        codeContent: getDirectoryContent(rootDir),
        ask: async (question: inquirer.Question) => {
            return await inquirer.prompt(question);
        },
        copyToClipboard: (content) => {
            copyOutputToClipboard(content);
        },
        log: (message) => {
            console.log(message);
        },
        getCodeBlockFromResponse: async (diff) => {
            return parseCode(diff, 'diff');
        },
        applyCodeDiff: async (diff) => {
            console.log('Appllying diff...');
            await applyDiff(diff);
            console.log('Diff applied!');
        },
        runPrompt,
    };

    let finalPrompt = ``;

    // Process the pre-prompt
    const prePrompt = await promptConfig.prePrompt(context);
    console.info(`Pre-prompt: ${prePrompt}`);
    finalPrompt += prePrompt;

    // Process the code content in the rootDir
    const content = await promptConfig.processContent(context);
    console.info(`Content: ${content}`);
    finalPrompt += content;

    // Process the post-prompt
    const postPrompt = await promptConfig.postPrompt(context);
    console.info(`Post-prompt: ${postPrompt}`);
    finalPrompt += postPrompt;

    console.info(`Final prompt: ${finalPrompt}`);

    // Handle response
    const llmResponse = await sendToLLM(finalPrompt, {
        responseType: promptConfig.responseType,
    });
    console.info(`LLM response: ${llmResponse}`);
    await promptConfig.handleResponse(llmResponse, context);
};

export const customPrompt = async (folderPath: string) => {
    runPrompt(promptConfigs.customPrompt(folderPath));
};
