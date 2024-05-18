import * as fs from 'fs';
import * as path from 'path';
import {
    AI_PROMPT,
    BINARY_FILE_SIGNATURE,
    OUTPUT_FILE,
    REQUEST_FILE,
    WHITELIST_FILE
} from './constants';
import { isIgnored } from './gitignore';

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
        this.writeAIPrompt();
    }

    // Write AI prompt
    private writeAIPrompt(): void {
        console.log('Writing AI prompt to output file...');
        fs.appendFileSync(this.outputFile, AI_PROMPT);
        this.writeEmptyLines();
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
    }

    // Process whitelist.patch-ai file
    processWhitelistFile(folderPath: string): void {
        const whitelistFile = path.join(folderPath, WHITELIST_FILE);
        if (fs.existsSync(whitelistFile)) {
            console.log('Reading folder paths from whitelist.patch-ai...');
            const lines = fs.readFileSync(whitelistFile, 'utf8').split('\n');
            lines.forEach((line) => {
                if (line.trim() !== '') {
                    console.log(`Processing path: ${line}`);
                    this.processLine(line);
                }
            });
        } else {
            console.error(`Error: Please provide a folder path as an argument or create a whitelist.patch-ai file.`);
            process.exit(1);
        }
    }

    // Process request.patch-ai file
    processRequestFile(folderPath: string): void {
        const requestFile = path.join(folderPath, REQUEST_FILE);
        if (fs.existsSync(requestFile)) {
            this.writeEmptyLines();
            console.log('Reading prompt from request.patch-ai...');
            const prompt = fs.readFileSync(requestFile, 'utf8');
            fs.appendFileSync(this.outputFile, prompt);
        } else {
            console.log('Suggestion: You can give me the changes that I should make, create a request.patch-ai file.');
        }
    }
}