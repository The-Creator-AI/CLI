import * as ParseDiff from 'parse-diff';

/**
 * Parses a Git diff string into a structured array of hunks.
 *
 * @param diff - The Git diff string.
 * @returns An array of hunks, where each hunk represents changes to a single file.
 */
export const parseDiff = (diff: string): ParseDiff.File[] => {
  return ParseDiff.default(diff);
};
