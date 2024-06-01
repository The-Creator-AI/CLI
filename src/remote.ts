import {
    readFileContent,
    writeEmptyLines,
} from './utils';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import {
    BETTERS_DIFF_REQUEST, COMPLETE_DIFF_REQUEST, DIFF_PATCH_FILE, LLM_RESPONSE_FILE,
} from './constants';
import * as fs from 'fs';
import { prompt } from 'inquirer';
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
    let retryCount = 0;
    while (retryCount < 3) {
        try {
            const response = await sendToLLM(outputFile);
            let diff = parseDiff(response);
            retryCount = 0;

            saveLLMResponse(response);

            // Write diff to diff.patch file
            fs.writeFileSync(DIFF_PATCH_FILE, diff);
            console.log(`Diff written to ${DIFF_PATCH_FILE} file!`);

            // Apply diff
            applyDiff(diff);
            console.log('Diff applied!');

            const answer = await prompt({
                type: 'confirm',
                name: 'isDiffCorrect',
                message: 'Is the diff correct?',
                default: true
            });

            if (!answer.isDiffCorrect) {
                console.log('Sending the prompt again for better diff.');
                await requestBetterDiff(outputFile);
            } else {
                const answer = await prompt({
                    type: 'confirm',
                    name: 'isDiffComplete',
                    message: 'Is the diff complete?',
                    default: true
                });
                if (!answer.isDiffComplete) {
                    console.log('Sending the prompt again for complete diff.');
                    await requestCompleteDiff(outputFile);
                }
            }

        } catch (error) {
            retryCount++;
            console.log('Diff parsing failed, retrying...');
            if (retryCount == 3) {
                console.log('Diff parsing failed 3 times, exiting...');
            }
        }
    }
};
