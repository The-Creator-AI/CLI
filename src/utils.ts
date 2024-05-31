import * as child_process from 'child_process'; // Import child_process module
import * as fs from 'fs';
import * as path from 'path';
import {
    BINARY_EXTENSTIONS
} from './constants';

// Function to write empty lines to the output file
export const writeEmptyLines = (outputFile: string): void => {
    // console.log('Writing empty lines to output file...');
    fs.appendFileSync(outputFile, '\n\n');
};

// Function to read the content of a file
export const readFileContent = (filePath: string): string => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(`Error reading file: ${err}`);
        return '';
    }
};

// Function to check if the path is a directory
export const isDirectory = (dirPath: string): boolean => {
    return fs.lstatSync(dirPath).isDirectory();};

// Function to check if a file is binary
export const isBinaryFile = (filePath: string): boolean => {
    const extensions = new Set(BINARY_EXTENSTIONS);
    return extensions.has(path.extname(filePath).slice(1).toLowerCase());
};

// Function to write the relative path of a file to the output file
export const writeRelativePath = (filePath: string, outputFile: string, suffix: string = ''): void => {
    const relativePath = path.relative(process.cwd(), filePath);
    fs.appendFileSync(outputFile, `${relativePath}${suffix}\n`);
};

// Function to write the content of a file to the output file
export const appendFileContent = (filePath: string, outputFile: string): void => {
    // console.log(`Writing file content to output file...`);                                                                                                                                                                     
    const fileContent = fs.readFileSync(filePath).toString();
    const lines = fileContent.split('\n');
    const numberedLines = lines.map((line, index) => `${index + 1}. ${line}`);
    fs.appendFileSync(outputFile, numberedLines.join('\n'));
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
