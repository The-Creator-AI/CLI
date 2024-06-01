import * as fs from 'fs';
import * as path from 'path';
import {
    DEFAULT_POST_PROMPT,
    DEFAULT_PRE_PROMPT,
    OUTPUT_FILE,
    POST_PROMPT_FILE,
    PRE_PROMPT_FILE
} from './constants.js';
import { isIgnored } from './ignore.js';
import { isBinaryFile, writeEmptyLines, getCodeWithLineNbr, getRelativePath } from './utils.js';

// Function to initialize the output file
export const initializeOutputFile = (folderPath: string): string => {
    const outputFile = path.join(folderPath, OUTPUT_FILE);
    console.log(`Creating output file: ${outputFile}`);
    fs.writeFileSync(outputFile, '');
    return outputFile;
};

// Function to process the pre-prompt
export const processPrePrompt = (folderPath: string, outputFile: string): void => {
    const requestFile = path.join(folderPath, PRE_PROMPT_FILE);
    if (fs.existsSync(requestFile)) {
        writeEmptyLines(outputFile);
        console.log('Reading prompt from the prompt file: ' + requestFile);
        const prompt = fs.readFileSync(requestFile, 'utf8');
        fs.appendFileSync(outputFile, prompt);
    } else {
        // create a pre-prompt file
        console.log(`Creating a prompt file: ${requestFile}`);
        fs.writeFileSync(requestFile, DEFAULT_PRE_PROMPT);
        fs.appendFileSync(outputFile, DEFAULT_PRE_PROMPT);
    }
    writeEmptyLines(outputFile);
};

// Function to process the post-prompt
export const processPostPrompt = (folderPath: string, outputFile: string): void => {
    const requestFile = path.join(folderPath, POST_PROMPT_FILE);
    if (fs.existsSync(requestFile)) {
        writeEmptyLines(outputFile);
        console.log('Reading prompt from the prompt file: ' + requestFile);
        const prompt = fs.readFileSync(requestFile, 'utf8');
        fs.appendFileSync(outputFile, prompt);
        fs.appendFileSync(outputFile, '\n');
    } else {
        // create a post-prompt file
        console.log(`Creating a prompt file: ${requestFile}`);
        fs.writeFileSync(requestFile, DEFAULT_POST_PROMPT);
        fs.appendFileSync(outputFile, DEFAULT_POST_PROMPT);
    }
};

// Function to display and process a single item (file or directory)
export const processPathContent = (itemPath: string) => {
    if (!fs.existsSync(itemPath)) {
        console.error(`Error: Path '${itemPath}' does not exist.`);
        return;
    }

    // console.log(`Processing item: ${itemPath}`);

    if (fs.lstatSync(itemPath).isDirectory()) {
        return getDirectoryContent(itemPath);
    } else {
        return getFilePathAndCode(itemPath);
    }
};

// Function to recursively process a directory
export const getDirectoryContent = (dirPath: string) => {
    let content = ``;
    fs.readdirSync(dirPath).forEach((item) => {
        const fullPath = path.join(dirPath, item);
        if (isIgnored(fullPath)) {
            console.log(`\x1b[31m${fullPath} is ignored\x1b[0m`);
            return;
        }
        content += '\n\n\n\n\n';
        content += processPathContent(fullPath);
        content += '\n\n\n\n\n';
        // console.log(`Processing item: ${fullPath}`);
    });
    return content;
};

// Function to process a single file
export const getFilePathAndCode = (filePath: string) => {
    // console.log(`Processing file '${filePath}'...`);
    const isBinary = isBinaryFile(filePath);

    if (!isBinary) {
        const relativeFilePath = getRelativePath(filePath);
        const code = getCodeWithLineNbr(filePath);
        const fileContent = `
            ${relativeFilePath}
            ${code}
            \n\n\n\n\n\n
        `;
        return fileContent;
    }
};
