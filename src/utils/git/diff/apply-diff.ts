import * as fs from 'fs';
import { File } from 'parse-diff';

/**
 * Applies a Git diff to the codebase, modifying files based on the diff changes.
 *
 * @param hunks - An array of hunks representing the diff changes.
 */
export const applyDiff = (hunks: File[]): void => {
    hunks.forEach(hunk => {
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

// Helper function to find the actual line number in the file content
const findActualLineNbr = (lines: string[], content: string, assumedLineNbr: number): number => {
    const delimiters = {
        '(': ')',
        '[': ']',
        '{': '}',
        '<': '>',
        '"': "'",
        "'": "'",
        '`': '`',
        '#': '*',
        '/': '\\',
        '_': ',',
        '-': '=',
        ':': ';',
        '?': '!',
    };

    const regExStr = `^[\\${Object.keys(delimiters).join('\\')}${Object.values(delimiters).join('\\')}\\s]+$`;
    if (new RegExp(regExStr).test(content)) {
        return -1;
    }
    const nbrOfLines = lines.length;
    const RANGE = 9;
    // look only +-RANGE lines around the ln2, consider the rest to be empty
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