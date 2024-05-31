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
    return diff;
};
