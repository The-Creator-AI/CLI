import * as ParseDiff from 'parse-diff';
import * as fs from 'fs';
import * as path from 'path';
export const parseDiff = (llmResponse: string) => {
    // find code with the patterns - ```diff ...code goes here... ```
    const diffStart = llmResponse.indexOf('```diff'); if (diffStart < 0) {
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

export const sanitizeDiff = (diff: string) => {
    return diff;
};

export const getDiffHunks = (diff: string) => {
    return ParseDiff.default(diff);
};

export const applyDiff = (diff: string) => {
    const hunks = getDiffHunks(diff);
    console.log(hunks);
    // Apply the hunks to the files
    hunks.map(hunk => {
        const filePath = hunk.from as string;
        const relativePath = path.relative(process.cwd(), filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        hunk.chunks.forEach(chunk => {
            chunk.changes.forEach(change => {
                if (change.type === 'add') {
                    lines.splice(change.ln - 1, 0, change.content);
                } else if (change.type === 'del') {
                    lines.splice(change.ln - 1, 1);
                }
            })
        })
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log(`File ${relativePath} updated!`);
    })
};
