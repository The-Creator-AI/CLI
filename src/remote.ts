import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';
import inquirer from 'inquirer';
// import fetch from 'node-fetch';
import * as openai from "openai";

import {
    BETTERS_DIFF_REQUEST, COMPLETE_DIFF_REQUEST,
    DIFF_PATCH_FILE,
    IMAGE_FOLDER,
    LLM_RESPONSE_FILE,
    OUTPUT_FILE
} from './constants.js';
import { getDirectoryContent } from './llm.js';
import type { Agent, AgentContext } from './types.js';
import {
    copyOutputToClipboard,
    openFile,
    readFileContent,
    resetUnstagedFiles
} from './utils.js';
import { parseCode } from './utils/code-parsing.js';
import { applyDiff } from './utils/git/diff/apply-diff.js';
import parseDiff from 'parse-diff';

// // global fetch
// (global as any).fetch = fetch;
// // global.Headers = fetch.Headers;
// (global as any).Headers = (fetch as any).Headers;
// // global.Request = fetch.Request;
// (global as any).Request = (fetch as any).Request;
// // global.Response = fetch.Response;
// (global as any).Response = (fetch as any).Response;

const getApiKey = () => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (geminiApiKey && openaiApiKey) {
        console.warn("Both GEMINI_API_KEY and OPENAI_API_KEY are set. Using GEMINI_API_KEY.");
    }

    if (geminiApiKey) {
        return { type: 'gemini', apiKey: geminiApiKey };
    } else if (openaiApiKey) {
        return { type: 'openai', apiKey: openaiApiKey };
    } else {
        throw new Error('Please set either GEMINI_API_KEY or OPENAI_API_KEY environment variable.');
    }
}

export const sendToLLM = async (prompt: string, options?: {
    responseType: 'text/plain' | 'application/json'
}) => {
    const { responseType = 'text/plain' } = options || {};
    const { type, apiKey } = getApiKey();

    if (type === 'gemini') {
        const genAI = new GoogleGenerativeAI(apiKey);
        const GEMINI_MODELS = (model: 'gemini-1.5-flash-latest' |
            'models/gemini-1.5-pro-latest' |
            'models/gemini-1.0' |
            'models/gemini-1.0-pro' |
            'models/gemini-0.1'
        ) => model;

        const model = genAI.getGenerativeModel({ model: GEMINI_MODELS('models/gemini-1.5-pro-latest') });
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

        return response.response.text();
    } else {
        const model = new openai.OpenAI({
            apiKey: apiKey,
        });
        const response = await model.completions.create({
            model: "gpt-3.5-turbo",
            prompt: prompt,
        });
        return response.choices[0].text || '';
    }
};

export const sendToLLMStream = async (prompt: string,  options?: {
    responseType: 'text/plain' | 'application/json'
}) => {
    const { responseType = 'text/plain' } = options || {};
    const { type, apiKey } = getApiKey();

    if (type === 'gemini') {
        const genAI = new GoogleGenerativeAI(apiKey);
        const GEMINI_MODELS = (model: 'gemini-1.5-flash-latest' |
            'models/gemini-1.5-pro-latest' |
            'models/gemini-1.0' |
            'models/gemini-1.0-pro' |
            'models/gemini-0.1'
        ) => model;
        let model = GEMINI_MODELS('models/gemini-1.5-pro-latest');
        let debounce = 0;
        while (true) {
            if (debounce > 0) {
                console.log(`Waiting for ${Math.floor(debounce / 1000)} seconds...`);
            }
            await new Promise(resolve => setTimeout(resolve, debounce));
            try {
                console.log(`Using model ${model}...`);
                const gemini = genAI.getGenerativeModel({ model });

                const imageParts: Part[] = [];
                const images = await getDirectoryContent(IMAGE_FOLDER);
                for (const image of images) {
                    const imagePart = {
                        image: {
                            fileData: fs.readFileSync(image),
                            mimeType: 'image/png'
                        }
                    }
                    imageParts.push(imagePart as any);
                }
                const response = await gemini.generateContentStream({
                    contents: [{
                        role: 'user',
                        parts: [{
                            text: prompt
                        },
                        ...imageParts,
                        ],
                    }],
                    generationConfig: {
                        responseMimeType: responseType
                    }
                });
                debounce = 0;
                let responseText = '';

                for await (const chunk of response.stream) {
                    responseText += chunk.text();
                    console.log(chunk.text());
                }

                return responseText;
            } catch(e: any) {
                debounce += 5000;
                if (e.status === 429) {
                    const newModel = GEMINI_MODELS('gemini-1.5-flash-latest');
                    console.log(`${model} limit reached, trying with ${newModel}`)
                    model = newModel;
                    continue;
                }
                console.log(e);
            }
        }
    } else {
        const model = new openai.OpenAI({
            apiKey: apiKey,
        });
        const response = await model.completions.create({
            model: "gpt-3.5-turbo",
            prompt: prompt,
        });
        return response.choices[0].text || '';
    }
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
    const response = await sendToLLMStream(newPrompt);
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
    const response = await sendToLLMStream(newPrompt);
    saveLLMResponse(response);
    applyCodeDiff(newPrompt, response);
};

const applyCodeDiff = async (llmPrompt: string, llmResponse: string) => {
    try {
        let diff = parseCode(llmResponse, 'diff');
        saveCodeBlock(diff);

        openPatchFile();

        console.log('Appllying diff...');
        applyDiff(parseDiff(diff));
        console.log('Diff applied!');

        const answer = await inquirer.prompt({
            type: 'confirm',
            name: 'isDiffCorrect',
            message: 'Is the diff correct?',
            default: true
        });

        if (!answer.isDiffCorrect) {
            const { diffAction } = await inquirer.prompt({
                type: 'list',
                name: 'diffAction',
                message: 'What do you want to do with the diff?',
                choices: [
                    {
                        name: 'Reapply the diff',
                        value: 'reapply',
                    },
                    {
                        name: 'Resend the prompt',
                        value: 'resend',
                    },
                ],
                default: 'resend',
            });

            if (diffAction === 'reapply') {
                console.log('Reapplying diff...');
                applyDiff(parseDiff(diff));
                console.log('Diff reapplied!');
            } else if (diffAction === 'resend') {
                resetUnstagedFiles();
                console.log('Sending the prompt again for better diff.');
                await requestBetterDiff(llmPrompt, llmResponse);
            }
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
export const runPrompt = async (promptConfig: Agent, _context?: AgentContext) => {
    const rootDir = promptConfig.rootDir;

    console.info(`Working with folder: ${rootDir}`);

    const context: AgentContext = {
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
            applyCodeDiff(context.prompt, context.response);
        },
        runPrompt,
        prompt: '',
        response: '',
        ..._context,
        codeContent: getDirectoryContent(rootDir),
    };

    // Build prompt
    const builtPrompt = await promptConfig.buildPrompt(context);
    context.prompt = builtPrompt.prompt;
    console.info(`Prompt: ${context.prompt}`);

    // console.info(`Final prompt: ${finalPrompt}`);
    saveLLMPrompt(context.prompt);

    // Handle response
    context.response = await sendToLLMStream(context.prompt, {
        responseType: builtPrompt.responseType,
    });
    saveLLMResponse(context.response);
    console.info(`LLM response: ${context.response}`);
    await promptConfig.handleResponse(context);
};
