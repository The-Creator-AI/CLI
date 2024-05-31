import { parseDiff } from "../diff";

describe('parseDiff', () => {
    it('should parse the diff correctly', () => {
        const llmResponse = `\`\`\`diff
10. Here goes the diff
\`\`\`
        `;
        const diff = parseDiff(llmResponse);
        expect(diff).toBe('Here goes the diff');
    });
});
