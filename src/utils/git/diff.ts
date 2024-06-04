import * as child_process from 'child_process';

/**
 * Gets the current Git diff (for staged changes).
 *
 * @returns The Git diff output as a string.
 */
export const getGitDiff = (): string => {
  const output = child_process.execSync(`git diff --cached`);
  return output.toString();
};

/**
 * Resets all unstaged changes in the current repository.
 *
 * @returns The Git reset output as a string.
 */
export const resetUnstagedFiles = (): string => {
  const output = child_process.execSync(`git restore .`);
  return output.toString();
};
