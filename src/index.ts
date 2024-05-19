import { FileProcessor } from './file-processor';

// Main execution
const folderPath = process.argv.length > 2 ? process.argv[2] : process.cwd();
const fileProcessor = new FileProcessor(folderPath);

fileProcessor.processPrePrompt(folderPath);

// Process folder
fileProcessor.processLine(folderPath);

// Process request file
fileProcessor.processPostPrompt(folderPath);

// Copy the output file to clipboard
fileProcessor.copyOutputToClipboard(folderPath); // Added this line