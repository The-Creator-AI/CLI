import {
    copyOutputToClipboard,
    getGitDiff,
    getPreviousRecords,
    gitCommit,
    readFileContent,
    saveNewRecord,
    writeEmptyLines,
} from './utils.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import {
    BETTERS_DIFF_REQUEST, COMPLETE_DIFF_REQUEST, POST_PROMPTS_FILE, DEFAULT_PRE_PROMPT, DIFF_PATCH_FILE, GENERATE_COMMIT_MSG, LLM_RESPONSE_FILE,
    OUTPUT_FILE,
    PRE_PROMPT_FILE,
    SUGGEST_THINGS,
} from './constants.js';
import * as fs from 'fs';
import inquirer from 'inquirer';
import { applyDiff, parseDiff } from './diff.js';
import { initializeOutputFile, getDirectoryContent, processPostPrompt, processPrePrompt } from './llm.js';
import autocomplete from 'inquirer-autocomplete-standalone';
import editor from '@inquirer/editor';

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
    const {
        responseType = 'text/plain'
    } = options || {};
    //  ***** Integrate Gemini API call here *****
    //  1. Get your API key (see [https://cloud.google.com/generative-ai/docs/quickstart](https://cloud.google.com/generative-ai/docs/quickstart))
    //  2. Replace 'YOUR_API_KEY' with your actual key 
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Or use 'gemini-1.5-flash' for a more general model 

    // Call Gemini API with the content of the output file
    const response = await model.generateContent({
        contents: [{
            role: 'user',
            parts: [{
                text: prompt
            }]
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

    // Append IGNORE_LINE_NUMBERS to the output file
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
            let diff = parseDiff(response);
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

export const generateCommitMessages = async () => {
    const gitDiff = getGitDiff();
    const response = await sendToLLM(`
        ${GENERATE_COMMIT_MSG}
        \n\n\n\n\n\n\n
        ${gitDiff}
    `, {
        responseType: 'application/json'
    });

    saveLLMResponse(response);

    const commitMessages = JSON.parse(response);

    const answers = await inquirer.prompt([
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
    ] as inquirer.Question[]);

    const commitMsg = commitMessages?.find((msg) => msg.commit === answers.action);
    gitCommit(commitMsg.commit, commitMsg.description);
};

export const suggestThings = async (folderPath: string) => {
    const content = getDirectoryContent(folderPath);
    const response = await sendToLLM(`
        ${content}
        \n\n\n\n\n\n\n
        ${SUGGEST_THINGS}
        `, {
        responseType: 'application/json'
    });

    saveLLMResponse(response);

    const suggestions = JSON.parse(response);

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Choose the commit message to apply',
            choices: suggestions?.map((suggestion) => ({
                name: suggestion,
                value: suggestion
            })),
            default: 'send',
        }
    ] as inquirer.Question[]);
    implementLLMDiff(`
        ${content}
        \n\n\n\n\n\n\n
        ${answers.action}
    `);
};

export const customPrompt = async (folderPath: string) => {
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
    })

    process.env['EDITOR'] = 'code';
    const sysInstructionEdited = await editor({
        message: 'Please choose a system instruction',
        default: sysInstruction as string
    });

    saveNewRecord(PRE_PROMPT_FILE, sysInstructionEdited);

    const content = getDirectoryContent(folderPath);
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
    })
    if (!sysInstruction) {
        console.error(`You didn't provide a valid prompt!`);
        return;
    }

    saveNewRecord(POST_PROMPTS_FILE, postPrompt as string);

    implementLLMDiff(`
${sysInstruction?.trim()}
        \n\n\n\n\n\n\n
        ${content}
        \n\n\n\n\n\n\n
${postPrompt?.trim()}
    `);
};