import * as fs from 'fs';
import * as path from 'path';

// Function to check if a path is ignored by a .gitignore file
export const isIgnored = (filePath: string): boolean => {
    const dirParts = filePath.split(path.sep);
    let currentDir = '';

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
                if (
                    pattern === '*' ||
                    pattern === '/*' ||
                    filePath.endsWith(pattern) ||
                    (pattern.startsWith('**/') && filePath.includes(pattern.slice(3))) ||
                    (pattern.startsWith('/') && filePath.endsWith(pattern.slice(1)))
                ) {
                    return true;
                }
            }
        }
    }

    return false;
};