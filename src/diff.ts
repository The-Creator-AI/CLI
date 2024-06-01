import * as ParseDiff from 'parse-diff';
import * as fs from 'fs';
// import * as path from 'path';

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

export const getDiffHunks = (diff: string) => {
    return ParseDiff.default(diff);
};

const findActualLineNbr = (lines: string[], content: string, assumedLineNbr: number) => {
    const nbrOfLines = lines.length;
    const RANGE = 3;
    // look only +-5 lines around the ln2, consider the rest to be empty
    let linesToSearch = lines.slice(assumedLineNbr - RANGE, assumedLineNbr + RANGE);
    try {
        // push empty lines in to make the linesToSearch array equal to lines
        [...new Array(assumedLineNbr - RANGE)]
            .forEach(() => linesToSearch.unshift(''));
        [...new Array(nbrOfLines - linesToSearch.length)]
            .forEach(() => linesToSearch.push(''));
    } catch (e) {
        linesToSearch = lines;
    }
    const actualLineNbr = linesToSearch.findIndex(line => content.includes(line) && line.trim() !== '');
    return actualLineNbr;
};

export const applyDiff = (diff: string) => {
    const hunks = getDiffHunks(diff);
    return hunks.forEach(hunk => {
        const filePath = hunk.from as string;
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        hunk.chunks.forEach(chunk => {
            let chunkIdx = -1;
            for (let i = 0; i < chunk.changes.length; i++) {
                const change = chunk.changes[i];
                const actualLineNbr = findActualLineNbr(lines, 
                    change.type === 'normal' ? change.content : change.content.slice(1),
                change['ln2'] || change['ln']);
                if (actualLineNbr >= 0) {
                    chunkIdx = actualLineNbr - i;
                    break;
                }
            }

            chunk.changes.map(change => {
                if (change.type === 'normal' && change.content.trim() !== '') {
                    const actualLineNbr = findActualLineNbr(lines, change.content, change.ln2);
                    if (actualLineNbr >= 0) {
                        chunkIdx = actualLineNbr;
                    }
                    chunkIdx++;
                } else if (change.type === 'add') {
                    lines.splice(chunkIdx, 0, change.content.slice(1));
                    chunkIdx++;
                } else if (change.type === 'del') {
                    const actualLineNbr = findActualLineNbr(lines, change.content, change.ln);
                    if (actualLineNbr >= 0) {
                        chunkIdx = actualLineNbr;
                    }
                    lines.splice(chunkIdx, 1);
                }
            })
        })
        fs.writeFileSync(filePath, lines.join('\n'));
    });
};
