import {
    readFileContent,
    writeEmptyLines,
} from './utils';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import { BETTERS_DIFF_REQUEST, COMPLETE_DIFF_REQUEST, DIFF_PATCH_FILE, LLM_RESPONSE_FILE } from './constants';
import * as fs from 'fs';
import readline from 'readline';
import { applyDiff, parseDiff } from './diff';

// global fetch
(global as any).fetch = fetch;
// global.Headers = fetch.Headers;
(global as any).Headers = (fetch as any).Headers;
// global.Request = fetch.Request;
(global as any).Request = (fetch as any).Request;
// global.Response = fetch.Response;
(global as any).Response = (fetch as any).Response;


export const sendToLLM = async (outputFile: string) => {
    //  ***** Integrate Gemini API call here *****
    //  1. Get your API key (see [https://cloud.google.com/generative-ai/docs/quickstart](https://cloud.google.com/generative-ai/docs/quickstart))
    //  2. Replace 'YOUR_API_KEY' with your actual key 
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Or use 'gemini-1.5-flash' for a more general model 

    // Call Gemini API with the content of the output file
    const outputFileContent = readFileContent(outputFile);
    const response = await model.generateContent(outputFileContent);

    // Convert the output to a git diff
    const diff = response.response.text();

    // Return the diff
    return diff;
};

export const saveLLMResponse = async (response: string) => {
    fs.writeFileSync(LLM_RESPONSE_FILE, response);
};

export const readLastLLMResponse = async () => {
    return readFileContent(LLM_RESPONSE_FILE);
};

export const requestCompleteDiff = async (outputFile: string) => {
    const lastLLMResponse = await readLastLLMResponse();
    writeEmptyLines(outputFile);
    fs.appendFileSync(outputFile, lastLLMResponse);
    writeEmptyLines(outputFile);
    fs.appendFileSync(outputFile, lastLLMResponse);
    writeEmptyLines(outputFile);
    fs.appendFileSync(outputFile, COMPLETE_DIFF_REQUEST);
    writeEmptyLines(outputFile);
    return await sendToLLM(outputFile);
};

export const requestBetterDiff = async (outputFile: string) => {
    const lastLLMResponse = await readLastLLMResponse();
    writeEmptyLines(outputFile);
    fs.appendFileSync(outputFile, lastLLMResponse);
    writeEmptyLines(outputFile);
    fs.appendFileSync(outputFile, lastLLMResponse);
    writeEmptyLines(outputFile);
    fs.appendFileSync(outputFile, BETTERS_DIFF_REQUEST);
    writeEmptyLines(outputFile);
    return await sendToLLM(outputFile);
};
// Function to handle the interaction with the LLM and apply the diff
export const handleLLMInteraction = async (outputFile: string) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let retryCount = 0;
    const response = await sendToLLM(outputFile);
    while (retryCount < 3) {
        try {
            let diff = parseDiff(response);
            saveLLMResponse(response);

            // Write diff to diff.patch file
            fs.writeFileSync(DIFF_PATCH_FILE, diff);
            console.log(`Diff written to ${DIFF_PATCH_FILE} file!`);

            // Apply diff
            applyDiff(diff);
            console.log('Diff applied!');

            rl.question("Is the diff correct? (yes/no) ", async (answer) => {
                if (answer.toLowerCase() === 'yes') {
                    rl.question("Is the diff complete? (yes/no) ", async (answer) => {
                        if (answer.toLowerCase() === 'yes') {
                            rl.close();
                        } else if (answer.toLowerCase() === 'no') {
                            console.log('Sending the prompt again for complete diff.');
                            await requestCompleteDiff(outputFile);
                            retryCount = 0;
                        } else {
                            console.log('Invalid input. Please enter "yes" or "no".');
                        }
                    });
                } else if (answer.toLowerCase() === 'no') {
                    console.log('Sending the prompt again for better diff.');
                    await requestBetterDiff(outputFile);
                    retryCount = 0;
                } else {
                    console.log('Invalid input. Please enter "yes" or "no".');
                }
            });
            break;
        } catch (error) {
            retryCount++;
            console.log('Diff parsing failed, retrying...');
            if (retryCount == 3) {
                console.log('Diff parsing failed 3 times, exiting...');
            }
        }
    }
};
