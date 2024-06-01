import * as ParseDiff from 'parse-diff';
import * as fs from 'fs';
// import * as path from 'path';

export const parseCode = (llmResponse: string, type: 'diff' | 'json') => {
    const codeStart = llmResponse.indexOf('```' + type); if (codeStart < 0) {
        console.error('No ```'+ type + '``` found in the response');
        return llmResponse;
    }
    // find the last ```
    let codeEnd = llmResponse.lastIndexOf('```');
    if (codeEnd < 0) {
        console.error('No ``` found in the response');
        return llmResponse;
    }
    codeEnd -= 1;

    let code = llmResponse.substring(codeStart + 8, codeEnd);

    // if each line has line number + dot + space
    // example:
    // 10. This is a line
    // 11. This is another line
    // Then remove those extra characters
    code = code.replace(/\s*\d+\.\s/g, '');
    return code;
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
                    if (chunkIdx < 0) {
                        chunkIdx = 0;
                    }
                    break;
                }
            }

            chunk.changes.map(change => {
                if (change.type === 'normal' && change.content.trim() !== '') {
                    const actualLineNbr = findActualLineNbr(lines, change.content, chunkIdx);
                    if (actualLineNbr >= 0) {
                        chunkIdx = actualLineNbr;
                    }
                    chunkIdx++;
                } else if (change.type === 'add') {
                    lines.splice(chunkIdx, 0, change.content.slice(1));
                    chunkIdx++;
                } else if (change.type === 'del') {
                    const actualLineNbr = findActualLineNbr(lines, change.content, chunkIdx);
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
