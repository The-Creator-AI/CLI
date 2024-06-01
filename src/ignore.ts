import ignore from 'ignore';
import parseGitignore from 'parse-gitignore';
import fs from 'fs';
import path from 'path';
import { isBinaryFile } from './utils.js';

const DEFAULT_IGNORE = [
  '*.llm', // Always add these patterns
  '.git',
  '.vscode',
  'node_modules',
  'yarn.lock',
  'package-lock.json',
  '*.log',
  '*.patch',
]

export const getIgnorePatterns = (dir: string) => {
  const gitIgnorePath = path.join(dir, '.gitignore');
  const ignoreLLMPath = path.join(dir, 'ignore.llm');

  try {
    if (fs.existsSync(ignoreLLMPath) && fs.statSync(ignoreLLMPath).mtimeMs >= (fs.existsSync(gitIgnorePath) && fs.statSync(gitIgnorePath).mtimeMs || 0)) {
      return fs.readFileSync(ignoreLLMPath, 'utf-8');
    }

    const gitIgnorePatterns = fs.existsSync(gitIgnorePath)
      ? parseGitignore(fs.readFileSync(gitIgnorePath, 'utf-8'))
      : [];
    const ignoreLLMPatterns = fs.existsSync(ignoreLLMPath)
      ? parseGitignore(fs.readFileSync(ignoreLLMPath, 'utf-8'))
      : [];

    const mergedPatterns = new Set([
      ...(gitIgnorePatterns?.patterns || []),
      ...(ignoreLLMPatterns?.patterns || []),
      ...DEFAULT_IGNORE
    ]);

    // create ignore.llm only if .gitignore exists
    if (gitIgnorePatterns?.patterns?.length) {
      fs.writeFileSync(ignoreLLMPath, [...mergedPatterns].join('\n'));
    }

    return [...mergedPatterns];
  } catch (error: any) {
    console.error(`Error processing ignore files: ${error.message}`);
    return [];
  }
};

export const isIgnored = (filePath: string): boolean => {
  // Handle binary files directly
  if (isBinaryFile(filePath)) {
    return true;
  }

  let currentDir = path.dirname(filePath); // Start from the file's directory
  let ignoreInstance: ignore.Ignore | null = null;

  // Iterate through ancestor directories until root is reached
  while (true) {
    try {
      const ignorePatterns = getIgnorePatterns(currentDir);
      if (ignorePatterns?.length) {
        ignoreInstance = ignore.default().add(ignorePatterns);
        // Make file path relative to the current directory being checked
        const relativeFilePath = path.relative(currentDir, filePath);
        if (ignoreInstance && ignoreInstance.ignores(relativeFilePath)) {
          return true;
        }
      }

    } catch (error: any) {
      console.error(`Error reading ignore files in ${currentDir}: ${error.message}`);
    }

    if (currentDir === path.parse(currentDir).root) {
      break;
    } else {
      // Move to the parent directory
      currentDir = path.dirname(currentDir);
    }
  }

  // If no matching ignore rule is found in any ancestor, the file is not ignored
  return false;
};
