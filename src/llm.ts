import * as fs from 'fs';
import * as path from 'path';
import { isIgnored } from './ignore.js';
import { getCodeWithLineNbr, getRelativePath, isBinaryFile } from './utils.js';

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
