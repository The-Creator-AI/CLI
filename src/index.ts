import {
  copyOutputToClipboard,
  readFileContent,
} from './utils';

import {
  initializeOutputFile,
  processPrePrompt,
  processPostPrompt,
  processPath,
} from './llm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

// global fetch
(global as any).fetch = fetch;
// global.Headers = fetch.Headers;
(global as any).Headers = (fetch as any).Headers;
// global.Request = fetch.Request;
(global as any).Request = (fetch as any).Request;
// global.Response = fetch.Response;
(global as any).Response = (fetch as any).Response;

// Main execution
const folderPath = process.argv.length > 2 ? process.argv[2] : process.cwd();

// Initialize the output file
const outputFile = initializeOutputFile(folderPath);

// Process the pre-prompt
processPrePrompt(folderPath, outputFile);

// Process folder
processPath(folderPath, outputFile);

// Process the post-prompt
processPostPrompt(folderPath, outputFile);

// Copy the output file to clipboard
copyOutputToClipboard(outputFile); // Added this line

// Process the post-prompt
processPostPrompt(folderPath, outputFile);

const getLLMResponse = async () => {
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

(async () => {
  const diff = await getLLMResponse();
  console.log(diff);
})();