import * as fs from 'fs';
import * as path from 'path';

// Function to check if a path is ignored by a .gitignore file
const isIgnored = (filePath: string): boolean => {
    const dirParts = filePath.split(path.sep);
    let currentDir = '';

    // Iterate through ancestor directories
    for (let i = 0; i < dirParts.length; i++) {
        currentDir = path.join(currentDir, dirParts[i]);
        const gitIgnoreFile = path.join(currentDir, '.gitignore');

        if (fs.existsSync(gitIgnoreFile)) {
            const ignorePatterns = fs
                .readFileSync(gitIgnoreFile, 'utf8')
                .split('\n')
                .map((pattern) => pattern.trim())
                .filter((pattern) => pattern && !pattern.startsWith('#'));

            for (const pattern of ignorePatterns) {
                // Check for simple wildcard patterns
                if (
                    pattern === '*' ||
                    pattern === '/*' ||
                    filePath.endsWith(pattern) ||
                    (pattern.startsWith('**/') &&
                        filePath.includes(pattern.slice(3))) || // Handle `**/` patterns
                    (pattern.startsWith('/') &&
                        filePath.endsWith(pattern.slice(1))) // Handle patterns starting with '/'
                ) {
                    return true;
                }
            }
        }
    }

    return false;
};

// Function to process a single line from whitelist.patch-ai or command line argument
const processLine = (path: string, outputFile: string) => {
    // Print the arguments to console
    console.log(`Path: ${path}`);
    console.log(`Output file: ${outputFile}`);

    // Check if path exists
    if (!fs.existsSync(path)) {
        console.error(`Error: Path '${path}' does not exist.`);
        return;
    }

    console.log(`Path '${path}' exists.`);
    displayItem(path, outputFile);
};

// Function to display a single item (file or folder) and write to file
const displayItem = (path: string, outputFile: string) => {
    // Check if path is a directory
    if (fs.lstatSync(path).isDirectory()) {
        console.log(`Traversing directory '${path}'...`);
        // Traverse the directory recursively
        fs.readdirSync(path).forEach((item) => {
            const fullPath = path + '/' + item;
            // Check if item is ignored by .gitignore
            if (isIgnored(fullPath)) {
                console.log(`Skipping ignored file or directory: ${fullPath}`);
                return;
            }
            console.log(`Processing item: ${fullPath}`);
            displayItem(fullPath, outputFile);
        });
    } else {
        // Process the file
        console.log(`Processing file '${path}'...`);
        // Check if file is binary
        const isBinary = fs.readFileSync(path).toString('hex').includes('FFD8FF') //  check for a JPEG file
            || fs.readFileSync(path).toString('hex').includes('47494638'); // check for a GIF file

        if (!isBinary) {
            // Print relative path
            console.log(`Writing relative path to output file...`);
            fs.appendFileSync(outputFile, `${path}\n`);

            // Print file content
            console.log(`Writing file content to output file...`);
            fs.appendFileSync(outputFile, fs.readFileSync(path).toString());
        } else {
            // Print relative path (binary)
            console.log(`Writing relative path (binary) to output file...`);
            fs.appendFileSync(outputFile, `${path} (binary)\n`);
        }
    }
};

// Check if argument is provided
let folderPath = process.cwd();
if (process.argv.length > 2) {
    folderPath = process.argv[2];
}

// Generate output file name
const outputFile = path.join(folderPath, 'tree_structure.txt');

// Create output file
console.log(`Creating output file: ${outputFile}`);
fs.writeFileSync(outputFile, '');

// Print AI prompt
console.log('Writing AI prompt to output file...');
fs.appendFileSync(outputFile, `I want to make changes to this codebase. You should help me with these changes.\n`);
fs.appendFileSync(outputFile, `I have created one long text with all the files of the project. \n`);
fs.appendFileSync(outputFile, `I'll tell you what to do and then you'll give me the changes that I should make.\n`);
fs.appendFileSync(outputFile, `First outline the changes you want to make.\n`);
fs.appendFileSync(outputFile, `Then give the actual code.\n`);
fs.appendFileSync(outputFile, `Remember, first explain to me the changes you want to make, then give me the actual code.\n`);
fs.appendFileSync(outputFile, `Here's what your response should look like:\n`);
fs.appendFileSync(outputFile, `Explanation:\n`);
fs.appendFileSync(outputFile, `Code:\n`);
fs.appendFileSync(outputFile, `The code should be in the same format as the original code. DO NOT GIVE GIT PATCH.\n`);

// Print empty line
console.log('Writing empty lines to output file...');
fs.appendFileSync(outputFile, `\n`);
fs.appendFileSync(outputFile, `\n`);

// Check if argument is provided
if (process.argv.length <= 2) {
    // Check if whitelist.patch-ai file exists
    const whitelistFile = path.join(folderPath, 'whitelist.patch-ai');
    if (fs.existsSync(whitelistFile)) {
        console.log('Reading folder paths from whitelist.patch-ai...');
        // Read folder paths from whitelist.patch-ai
        const lines = fs.readFileSync(whitelistFile, 'utf8').split('\n');
        lines.forEach((line) => {
            if (line.trim() !== '') {
                // Process each line
                console.log(`Processing path: ${line}`);
                processLine(line, outputFile);
            }
        });
    } else {
        console.error(`Error: Please provide a folder path as an argument or create a whitelist.patch-ai file.`);
        process.exit(1);
    }
} else {
    // Process the provided folder path
    console.log(`Processing path: ${folderPath}`);
    processLine(folderPath, outputFile);
}

// At the bottom append the prompt from request.patch-ai
const requestFile = path.join(folderPath, 'request.patch-ai');
if (fs.existsSync(requestFile)) {
    // Add empty lines
    console.log('Writing empty lines to output file...');
    fs.appendFileSync(outputFile, `\n`);
    fs.appendFileSync(outputFile, `\n`);
    fs.appendFileSync(outputFile, `\n`);
    fs.appendFileSync(outputFile, `\n`);

    console.log('Reading prompt from request.patch-ai...');
    // Read the prompt from request.patch-ai
    const prompt = fs.readFileSync(requestFile, 'utf8');
    fs.appendFileSync(outputFile, prompt);
} else {
    console.log('Suggestion: You can give me the changes that I should make, create a request.patch-ai file.');
}

// Close the output file
console.log('Closing output file...');

// Open the output file
console.log('Opening output file...');
// Open the file using the default application for the file type
// Replace with your own command if needed
try {
    fs.openSync(outputFile, 'r');
    console.log(`Output file ${outputFile} opened successfully.`);
} catch (error) {
    console.error(`Error opening output file: ${error}`);
}