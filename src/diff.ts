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
    return diff;
};

export const sanitizedDiff = (diff: string) => {
    const hunks = getDiffHunks(diff);
    // Adjust line numbers for 'normal' type changes
    let lineNbrDiffFromOriginalFile = 0;
    let lineNbrOffsetByChanges = 0;
    return hunks.map(hunk => {
        const filePath = hunk.from as string;
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        return {
            ...hunk,
            chunks: hunk.chunks.map(chunk => {
                return {
                    ...chunk,
                    changes: chunk.changes.map(change => {
                        console.log(change);
                        if (change.type === 'normal' && change.content.trim() !== '') {
                            // Adjust line number based on the actual file content
                            const actualLineNumber = lines.findIndex(line => line.trim() === change.content.trim()) + 1;
                            // change.ln1 = actualLineNumber;
                            lineNbrDiffFromOriginalFile = actualLineNumber - change.ln1;
                        } else if (change.type === 'add') {
                            lineNbrOffsetByChanges += 1;
                        } else if (change.type === 'del') {
                            lineNbrOffsetByChanges -= 1;
                        }
                        if (change['ln1']) {
                            change['ln1'] += lineNbrDiffFromOriginalFile;
                        }
                        if (change['ln2']) {
                            change['ln2'] += lineNbrDiffFromOriginalFile;
                        }
                        console.log(lineNbrDiffFromOriginalFile + lineNbrOffsetByChanges);
                        return {
                            ...change,
                            ln1: change['ln1'] ? change['ln1'] + lineNbrDiffFromOriginalFile + lineNbrOffsetByChanges : change['ln1'],
                            ln2: change['ln2'] ? change['ln2'] + lineNbrDiffFromOriginalFile + lineNbrOffsetByChanges : change['ln2'],
                            ln: change['ln'] ? change['ln'] + lineNbrDiffFromOriginalFile : change['ln']
                        };
                    })
                };
            })
        };
    });
};

export const getDiffHunks = (diff: string) => {
    return ParseDiff.default(diff);
};

export const applyDiff = (diff: string) => {
    const hunks = sanitizedDiff(diff);

    // Apply the hunks to the files
    hunks.map(hunk => {
        const filePath = hunk.from as string;
        const relativePath = path.relative(process.cwd(), filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        hunk.chunks.forEach(chunk => {
            chunk.changes.forEach(change => {
                // console.log(change);
                if (change.type === 'add') {
                    lines.splice(change.ln - 1, 0, change.content.slice(1));
                } else if (change.type === 'del') {
                    lines.splice(change.ln - 1, 1);
                }
            })
        })
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log(`File ${relativePath} updated!`);
    })
};
