import * as child_process from 'child_process';

/**
 * Gets the current Git status output.
 *
 * @returns The Git status output as a string.
 */
export const getGitStatus = (): string => {
    const output = child_process.execSync('git status');
    return output.toString();
};

/**
 * Checks if there are any unstaged changes in the Git repository.
 *
 * @returns `true` if there are unstaged changes, `false` otherwise.
 */
export const hasUnstagedChanges = (): boolean => {
    const statusOutput = getGitStatus();
    return statusOutput.includes('Changes not staged for commit:') ||
        statusOutput.includes('Untracked files:');
};

/**
 * Checks if there are any staged changes in the Git repository.
 *
 * @returns `true` if there are staged changes, `false` otherwise.
 */
export const hasStagedChanges = (): boolean => {
    const statusOutput = getGitStatus();
    return statusOutput.includes('Changes to be committed:') ||
        statusOutput.includes('new file:') ||
        statusOutput.includes('deleted:') ||
        statusOutput.includes('modified:');
};

/**
 * Gets a list of unstaged files from the Git status output.
 *
 * @returns An array of unstaged file paths, or an empty array if there are no unstaged files.
 */
export const getUnstagedFiles = (): string[] => {
    const statusOutput = getGitStatus();
    const lines = statusOutput.split('\n');
    const unstagedFiles: string[] = [];
    let inUnstagedSection = false;

    for (const line of lines) {
        if (line.includes('Changes not staged for commit:')) {
            inUnstagedSection = true;
        } else if (line.includes('Untracked files:') || line.trim() === '') {
            inUnstagedSection = false;
        } else if (inUnstagedSection) {
            const filePath = line.trim().split(' ')[1];
            unstagedFiles.push(filePath);
        }
    }

    return unstagedFiles;
};

/**
 * Gets a list of staged files from the Git status output.
 *
 * @returns An array of staged file paths, or an empty array if there are no staged files.
 */
export const getStagedFiles = (): string[] => {
    const statusOutput = getGitStatus();
    const lines = statusOutput.split('\n');
    const stagedFiles: string[] = [];
    let inStagedSection = false;

    for (const line of lines) {
        if (line.includes('Changes to be committed:')) {
            inStagedSection = true;
        } else if (line.includes('new file:') || line.includes('deleted:') || line.includes('modified:') || line.trim() === '') {
            inStagedSection = false;
        } else if (inStagedSection) {
            const filePath = line.trim().split(' ')[1];
            stagedFiles.push(filePath);
        }
    }

    return stagedFiles;
};