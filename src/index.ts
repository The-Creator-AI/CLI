import { FileProcessor } from './file-processor';

// Main execution
const folderPath = process.argv.length > 2 ? process.argv[2] : process.cwd();
const fileProcessor = new FileProcessor(folderPath);

// Process folder or whitelist file
if (process.argv.length <= 2) {
    fileProcessor.processWhitelistFile(folderPath);
} else {
    fileProcessor.processLine(folderPath);
}

// Process request file
fileProcessor.processRequestFile(folderPath);

// Copy the output file to clipboard
fileProcessor.copyOutputToClipboard(folderPath); // Added this line