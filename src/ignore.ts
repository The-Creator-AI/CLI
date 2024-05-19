import * as fs from 'fs';
import * as path from 'path';

export const ensureIgnoreFileExists = (dir: string): void => {
    if (!fs.existsSync('ignore.llm')) {
        const gitIgnoreFile = path.join(dir, '.gitignore');
        const ignorePatterns = fs
            .readFileSync(gitIgnoreFile, 'utf8')
            .split('\n')
            .map((pattern) => pattern.trim())
            .filter((pattern) => pattern && !pattern.startsWith('#'));

        // if .gitignore didn't have *.llm, add it to the .gitignore as well
        if (!ignorePatterns.includes('*.llm')) {
            ignorePatterns.push('*.llm');
            fs.writeFileSync(gitIgnoreFile, ignorePatterns.join('\n'));
        }

        // create ignore.llm file
        ignorePatterns.push('*.llm');
        fs.writeFileSync('ignore.llm', ignorePatterns.join('\n'));
    }
}

// Function to check if a path is ignored by a .gitignore file
export const isIgnored = (filePath: string): boolean => {
    const dirParts = filePath.split(path.sep);
    let currentDir = '';

    for (let i = 0; i < dirParts.length; i++) {
        currentDir = path.join(currentDir, dirParts[i]);
        const gitIgnoreFile = path.join(currentDir, '.gitignore');
        const ignoreLLMFile = path.join(currentDir, 'ignore.llm');

        if (fs.existsSync(gitIgnoreFile)) {
            ensureIgnoreFileExists(currentDir);

            const ignorePatterns = fs
                .readFileSync(ignoreLLMFile, 'utf8')
                .split('\n')
                .map((pattern) => pattern.trim())
                .filter((pattern) => pattern && !pattern.startsWith('#'));
            ignorePatterns.push('.git');
            ignorePatterns.push('*.llm');

            for (const pattern of ignorePatterns) {
                if (
                    pattern === '*' ||
                    pattern === '/*' ||
                    filePath.endsWith(pattern) ||
                    (pattern.startsWith('**/') && filePath.includes(pattern.slice(3))) ||
                    (pattern.startsWith('/') && filePath.endsWith(pattern.slice(1))) ||
                    (pattern.startsWith('*.') && filePath.endsWith(pattern.slice(1)))
                ) {
                    return true;
                }
            }
        }
    }

    return false;
};