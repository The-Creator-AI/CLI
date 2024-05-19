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
import { isIgnored } from './gitignore';
import * as child_process from 'child_process'; // Import child_process module

// Class for processing files and directories
export class FileProcessor {
    private outputFile: string;

    constructor(folderPath: string) {
        this.outputFile = path.join(folderPath, OUTPUT_FILE);
        this.initializeOutputFile();
    }

    // Initialize output file
    private initializeOutputFile(): void {
        console.log(`Creating output file: ${this.outputFile}`);
        fs.writeFileSync(this.outputFile, '');
    }

    processPrePrompt(folderPath: string): void {
        const requestFile = path.join(folderPath, PRE_PROMPT_FILE);
        if (fs.existsSync(requestFile)) {
            this.writeEmptyLines();
            console.log('Reading prompt from the prompt file: ' + requestFile);
            const prompt = fs.readFileSync(requestFile, 'utf8');
            fs.appendFileSync(this.outputFile, prompt);
        } else {
            // create a pre-prompt file
            console.log(`Creating a prompt file: ${requestFile}`);
            fs.writeFileSync(requestFile, DEFAULT_PRE_PROMPT);
            fs.appendFileSync(this.outputFile, DEFAULT_PRE_PROMPT);
        }
        this.writeEmptyLines();
    }

    processPostPrompt(folderPath: string): void {
        const requestFile = path.join(folderPath, POST_PROMPT_FILE);
        if (fs.existsSync(requestFile)) {
            this.writeEmptyLines();
            console.log('Reading prompt from the prompt file: ' + requestFile);
            const prompt = fs.readFileSync(requestFile, 'utf8');
            fs.appendFileSync(this.outputFile, prompt);
        } else {
            // create a post-prompt file
            console.log(`Creating a prompt file: ${requestFile}`);
            fs.writeFileSync(requestFile, DEFAULT_POST_PROMPT);
            fs.appendFileSync(this.outputFile, DEFAULT_POST_PROMPT);
        }
    }

    // Write empty lines
    private writeEmptyLines(): void {
        console.log('Writing empty lines to output file...');
        fs.appendFileSync(this.outputFile, '\n\n');
    }

    // Process a single line from whitelist.patch-ai or command line argument
    processLine(filePath: string): void {
        console.log(`Path: ${filePath}`);
        console.log(`Output file: ${this.outputFile}`);

        if (!fs.existsSync(filePath)) {
            console.error(`Error: Path '${filePath}' does not exist.`);
            return;
        }

        console.log(`Path '${filePath}' exists.`);
        this.displayItem(filePath);
    }

    // Function to display a single item (file or folder) and write to file
    displayItem(filePath: string): void {
        if (fs.lstatSync(filePath).isDirectory()) {
            this.processDirectory(filePath);
        } else {
            this.processFile(filePath);
        }
    }

    // Process a directory recursively
    private processDirectory(dirPath: string): void {
        console.log(`Traversing directory '${dirPath}'...`);
        fs.readdirSync(dirPath).forEach((item) => {
            const fullPath = path.join(dirPath, item);
            if (isIgnored(fullPath)) {
                console.log(`Skipping ignored file or directory: ${fullPath}`);
                return;
            }
            console.log(`Processing item: ${fullPath}`);
            this.displayItem(fullPath);
        });
    }

    // Process a file
    private processFile(filePath: string): void {
        console.log(`Processing file '${filePath}'...`);
        const isBinary = this.isBinaryFile(filePath);

        if (!isBinary) {
            this.writeRelativePath(filePath);
            this.writeFileContent(filePath);
        } else {
            this.writeRelativePath(filePath, ' (binary)');
        }
    }

    // Check if file is binary
    private isBinaryFile(filePath: string): boolean {
        const fileContent = fs.readFileSync(filePath).toString('hex');
        return BINARY_FILE_SIGNATURE.some((signature) => fileContent.includes(signature));
    }

    // Write relative path to output file
    private writeRelativePath(filePath: string, suffix: string = ''): void {
        console.log(`Writing relative path${suffix} to output file...`);
        fs.appendFileSync(this.outputFile, `${filePath}${suffix}\n`);
    }

    // Write file content to output file
    private writeFileContent(filePath: string): void {
        console.log(`Writing file content to output file...`);
        fs.appendFileSync(this.outputFile, fs.readFileSync(filePath).toString());
        this.writeEmptyLines();
    }

    // Function to copy the output file to clipboard
    copyOutputToClipboard(folderPath: string): void {
        const outputFilePath = path.join(folderPath, OUTPUT_FILE);
        let command: string;
        if (process.platform === 'win32') {
            command = `type ${outputFilePath} | clip`;
        } else {
            command = `pbcopy < ${outputFilePath}`;
        }
        console.log(`Copying output file content to clipboard...`);
        child_process.execSync(command);
        console.log('Output file content copied to clipboard!');
    }
}