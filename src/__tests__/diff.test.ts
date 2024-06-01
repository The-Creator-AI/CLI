import { getDiffHunks, parseCode } from "../diff.js";

describe('parseCode', () => {
    it('should parse the diff correctly', () => {
        const llmResponse = `\`\`\`diff
10. Here goes the diff
\`\`\`
        `;
        const diff = parseCode(llmResponse, 'diff');
        expect(diff).toBe('Here goes the diff');
    });
});

describe("getDiffHunks", () => {
    it("parses a single-file diff with one hunk", () => {
        const diff = `
--- a/file.txt
+++ b/file.txt
@@ -1,5 +1,6 @@
 This is the first line.
-This line is removed.
+This line is modified.
+This line is added.
 And this is the last line.
`;

        expect(getDiffHunks(diff)).toMatchInlineSnapshot(`
Array [
  Object {
    "additions": 2,
    "chunks": Array [
      Object {
        "changes": Array [
          Object {
            "content": " This is the first line.",
            "ln1": 1,
            "ln2": 1,
            "normal": true,
            "type": "normal",
          },
          Object {
            "content": "-This line is removed.",
            "del": true,
            "ln": 2,
            "type": "del",
          },
          Object {
            "add": true,
            "content": "+This line is modified.",
            "ln": 2,
            "type": "add",
          },
          Object {
            "add": true,
            "content": "+This line is added.",
            "ln": 3,
            "type": "add",
          },
          Object {
            "content": " And this is the last line.",
            "ln1": 3,
            "ln2": 4,
            "normal": true,
            "type": "normal",
          },
        ],
        "content": "@@ -1,5 +1,6 @@",
        "newLines": 6,
        "newStart": 1,
        "oldLines": 5,
        "oldStart": 1,
      },
    ],
    "deletions": 1,
    "from": "file.txt",
    "to": "file.txt",
  },
]
`);
    });

    // it("parses a single-file diff with multiple hunks", () => {
    //     const diff = /* ... Your diff string with multiple hunks ... */
    //         // Define expectedHunks accordingly

    //         expect(getDiffHunks(diff)).toEqual(expectedHunks);
    // });

    // it("parses a multi-file diff", () => {
    //     const diff = /* ... Your diff string with changes in multiple files ... */
    //         // Define expectedHunks accordingly

    //         expect(getDiffHunks(diff)).toEqual(expectedHunks);
    // });

    it("handles an empty diff", () => {
        expect(getDiffHunks("")).toEqual([]);
    });

    it("handles corner cases like binary files or merge conflicts", () => {
        const diffWithBinary = `
diff --git a/image.png b/image.png
Binary files a/image.png and b/image.png differ
`;
        expect(getDiffHunks(diffWithBinary)).toMatchInlineSnapshot(`
Array [
  Object {
    "additions": 0,
    "chunks": Array [],
    "deletions": 0,
    "from": "image.png",
    "to": "image.png",
  },
]
`);

        const diffWithMergeConflict = `
<<<<<<< HEAD
This is the first line.
=======
This is another first line.
>>>>>>> branch-name
`;
        // Depending on your expected behavior, either return an empty array or 
        // a specific structure for conflicts
        expect(getDiffHunks(diffWithMergeConflict)).toEqual([]);
    });
});
