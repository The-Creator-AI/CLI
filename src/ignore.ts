import * as fs from 'fs';
import * as path from 'path';

export const ensureIgnoreFileExists = (dir: string): void => {
    const gitIgnorePath = path.join(dir, '.gitignore');
    const ignoreLLMPath = path.join(dir, 'ignore.llm');

    try {
        const gitIgnoreStats = fs.existsSync(gitIgnorePath) && fs.statSync(gitIgnorePath);
        const ignoreLLMStats = fs.existsSync(ignoreLLMPath) && fs.statSync(ignoreLLMPath);

        // return if ignore.llm is newer than .gitignore
        if (ignoreLLMStats && (!gitIgnoreStats || ignoreLLMStats.mtimeMs > gitIgnoreStats.mtimeMs)) {
            return;
        }

        const gitIgnorePatterns = gitIgnoreStats
            ? new Set(
                fs.readFileSync(gitIgnorePath, 'utf8')
                    .split('\n')
                    .map(pattern => pattern.trim())
                    .filter(pattern => pattern && !pattern.startsWith('#'))
            )
            : new Set();

        const ignoreLLMPatterns = ignoreLLMStats
            ? new Set(
                fs.readFileSync(ignoreLLMPath, 'utf8')
                    .split('\n')
                    .map(pattern => pattern.trim())
                    .filter(pattern => pattern && !pattern.startsWith('#'))
            )
            : new Set();

        // Merge the two sets of patterns while ensuring uniqueness and keeping *.llm
        const mergedPatterns = new Set([
            ...gitIgnorePatterns,
            ...ignoreLLMPatterns,
            '*.llm',
            ".git",
            ".vscode",
            "node_modules"
        ]);

        // Check if either file is newer, or if the contents have changed
        const shouldUpdate = !ignoreLLMStats
            || (gitIgnoreStats && gitIgnoreStats.mtimeMs > ignoreLLMStats.mtimeMs)
            || !areSetsEqual(gitIgnorePatterns, ignoreLLMPatterns);

        if (shouldUpdate) {
            fs.writeFileSync(ignoreLLMPath, [...mergedPatterns].join('\n'));
        }
    } catch (error: any) {
        console.error(`Error processing ignore files: ${error.message}`);
    }
};

function areSetsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    return a.size === b.size && [...a].every(value => b.has(value));
}

// Function to check if a path is ignored by a .gitignore file
export const isIgnored = (filePath: string): boolean => {
    const dirParts = filePath.split(path.sep);
    let currentDir = '';

    for (let i = 0; i < dirParts.length; i++) {
        currentDir = path.join(currentDir, dirParts[i]);

        const gitIgnoreFile = path.join(currentDir, '.gitignore');
        const ignoreLLMFile = path.join(currentDir, 'ignore.llm');

        if (fs.existsSync(gitIgnoreFile) || fs.existsSync(ignoreLLMFile)) {
            ensureIgnoreFileExists(currentDir); // Ensure ignore.llm is up-to-date

            const ignorePatterns = fs
                .readFileSync(ignoreLLMFile, 'utf8')
                .split('\n')
                .map((pattern) => pattern.trim())
                .filter((pattern) => pattern && !pattern.startsWith('#'));

            for (const pattern of ignorePatterns) {
                // Normalize the pattern (remove leading slash if present)
                let normalizedPattern = pattern.startsWith('/') ? pattern.slice(1) : pattern;

                // Handle patterns ending with a slash (match directories only)
                const isDirectoryPattern = normalizedPattern.endsWith('/');
                if (isDirectoryPattern) {
                    if (!fs.lstatSync(filePath).isDirectory()) {
                        continue; // Skip to the next pattern if not a directory
                    }
                    // Remove trailing slash for directory comparison
                    normalizedPattern = normalizedPattern.slice(0, -1);
                }

                // Check for different matching scenarios
                if (
                    normalizedPattern === '*' ||                 // Ignore everything in this directory
                    normalizedPattern === '**' ||               // Ignore everything in this directory and subdirectories
                    normalizedPattern === filePath ||            // Exact path match
                    filePath.endsWith(normalizedPattern) ||       // File or directory name match at the end of the path
                    (normalizedPattern.startsWith('**/') && filePath.includes(normalizedPattern.slice(3))) || // Match in any subdirectory
                    (normalizedPattern.startsWith('/') && filePath.includes(normalizedPattern)) // Path match within the current directory
                ) {
                    return true;
                }

                // Handle wildcard file extension match
                if (normalizedPattern.startsWith('*.') && filePath.endsWith(normalizedPattern.slice(1))) {
                    return true;
                }
            }
        }
    }
  
    return false;
};