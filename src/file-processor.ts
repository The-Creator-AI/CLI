import * as fs from 'fs';
import * as path from 'path';
import {
    BINARY_FILE_SIGNATURE,
    DEFAULT_POST_PROMPT,
    DEFAULT_PRE_PROMPT,
    OUTPUT_FILE,
    POST_PROMPT_FILE,
    PRE_PROMPT_FILE
} from './constants';
import { isIgnored } from './ignore';
import * as child_process from 'child_process'; // Import child_process module

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
    } else {
        // create a post-prompt file
        console.log(`Creating a prompt file: ${requestFile}`);
        fs.writeFileSync(requestFile, DEFAULT_POST_PROMPT);
        fs.appendFileSync(outputFile, DEFAULT_POST_PROMPT);
    }
};

// Function to write empty lines to the output file
export const writeEmptyLines = (outputFile: string): void => {
    console.log('Writing empty lines to output file...');
    fs.appendFileSync(outputFile, '\n\n');
};

// Function to process a single line (file or directory)
export const processLine = (filePath: string, outputFile: string): void => {
    console.log(`Path: ${filePath}`);
    console.log(`Output file: ${outputFile}`);

    if (!fs.existsSync(filePath)) {
        console.error(`Error: Path '${filePath}' does not exist.`);
        return;
    }

    console.log(`Path '${filePath}' exists.`);
    displayItem(filePath, outputFile);
};

// Function to display and process a single item (file or directory)
export const displayItem = (filePath: string, outputFile: string): void => {
    if (fs.lstatSync(filePath).isDirectory()) {
        processDirectory(filePath, outputFile);
    } else {
        processFile(filePath, outputFile);
    }
};

// Function to recursively process a directory
export const processDirectory = (dirPath: string, outputFile: string): void => {
    console.log(`Traversing directory '${dirPath}'...`);
    fs.readdirSync(dirPath).forEach((item) => {
        const fullPath = path.join(dirPath, item);
        if (isIgnored(fullPath)) {
            console.log(`Skipping ignored file or directory: ${fullPath}`);
            return;
        }
        console.log(`Processing item: ${fullPath}`);
        displayItem(fullPath, outputFile);
    });
};

// Function to process a single file
export const processFile = (filePath: string, outputFile: string): void => {
    console.log(`Processing file '${filePath}'...`);
    const isBinary = isBinaryFile(filePath);

    if (!isBinary) {
        writeRelativePath(filePath, outputFile);
        writeFileContent(filePath, outputFile);
    } else {
        writeRelativePath(filePath, outputFile, ' (binary)');
    }
};

// Function to check if a file is binary
export const isBinaryFile = (filePath: string): boolean => {
    const fileContent = fs.readFileSync(filePath).toString('hex');
    return BINARY_FILE_SIGNATURE.some((signature) => fileContent.includes(signature));
};

// Function to write the relative path of a file to the output file
export const writeRelativePath = (filePath: string, outputFile: string, suffix: string = ''): void => {
    console.log(`Writing relative path${suffix} to output file...`);
    fs.appendFileSync(outputFile, `${filePath}${suffix}\n`);
};

// Function to write the content of a file to the output file
export const writeFileContent = (filePath: string, outputFile: string): void => {
    console.log(`Writing file content to output file...`);
    fs.appendFileSync(outputFile, fs.readFileSync(filePath).toString());
    writeEmptyLines(outputFile);
};

// Function to copy the content of the output file to the clipboard
export const copyOutputToClipboard = (outputFile: string): void => {
    let command: string;
    if (process.platform === 'win32') {
        command = `type ${outputFile} | clip`;
    } else {
        command = `pbcopy < ${outputFile}`;
    }
    console.log(`Copying output file content to clipboard...`);
    child_process.execSync(command);
    console.log('Output file content copied to clipboard!');
};
