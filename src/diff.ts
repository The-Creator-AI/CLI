import * as ParseDiff from 'parse-diff';

export const parseDiff = (llmResponse: string) => {
    // find code with the patterns - ```diff ...code goes here... ```
    const diffStart = llmResponse.indexOf('```diff');
    if (diffStart < 0) {
        throw new Error('No ```diff``` found in the response');
    }
    // find the last ```
    let diffEnd = llmResponse.lastIndexOf('```');
    if (diffEnd < 0) {
        throw new Error('No ``` found in the response');
    }
    diffEnd -= 1;

    let diff = llmResponse.substring(diffStart + 8, diffEnd);

    // if each line has line number + dot + space
    // example:
    // 10. This is a line
    // 11. This is another line
    // Then remove those extra characters
    diff = diff.replace(/\s*\d+\.\s/g, '');
    return sanitizeDiff(diff);
};

export const getDiffHunks = (diff: string) => {
    return ParseDiff.default(diff);
};


export const sanitizeDiff = (diff: string) => {
    return diff;
};
