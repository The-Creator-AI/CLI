import * as fs from 'fs';
import * as path from 'path';
import {
    DEFAULT_POST_PROMPT,
    DEFAULT_PRE_PROMPT,
    IGNORE_LINE_NUMBERS,
    OUTPUT_FILE,
    POST_PROMPT_FILE,
    PRE_PROMPT_FILE
} from './constants';
import { isIgnored } from './ignore';
import { isBinaryFile, writeEmptyLines, appendFileContent, writeRelativePath } from './utils';

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
        fs.appendFileSync(outputFile, IGNORE_LINE_NUMBERS);
    } else {
        // create a post-prompt file
        console.log(`Creating a prompt file: ${requestFile}`);
        fs.writeFileSync(requestFile, DEFAULT_POST_PROMPT);
        fs.appendFileSync(outputFile, DEFAULT_POST_PROMPT);
    }
};

// Function to display and process a single item (file or directory)
export const processPath = (itemPath: string, outputFile: string): void => {
    if (!fs.existsSync(itemPath)) {
        console.error(`Error: Path '${itemPath}' does not exist.`);
        return;
    }

    // console.log(`Processing item: ${itemPath}`);

    if (fs.lstatSync(itemPath).isDirectory()) {
        processDirectory(itemPath, outputFile);
    } else {
        processFile(itemPath, outputFile);
    }
};

// Function to recursively process a directory
export const processDirectory = (dirPath: string, outputFile: string): void => {
    // console.log(`Traversing directory '${dirPath}'...`);
    fs.readdirSync(dirPath).forEach((item) => {
        const fullPath = path.join(dirPath, item);
        if (isIgnored(fullPath)) {
            console.log(`\x1b[31m${fullPath} is ignored\x1b[0m`);
            return;
        }
        // console.log(`Processing item: ${fullPath}`);
        processPath(fullPath, outputFile);
    });
};

// Function to process a single file
export const processFile = (filePath: string, outputFile: string): void => {
    // console.log(`Processing file '${filePath}'...`);
    const isBinary = isBinaryFile(filePath);

    if (!isBinary) {
        writeRelativePath(filePath, outputFile);
        appendFileContent(filePath, outputFile);
    }
};
