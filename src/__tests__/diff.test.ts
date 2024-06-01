import { getDiffHunks, parseCode } from "../diff.js";

describe('parseCode', () => {
  it('should parse the diff correctly with line numbers', () => {
    const llmResponse = `\`\`\`diff
1. Here goes the diff
+3. This is another line
\`\`\``;
    const diff = parseCode(llmResponse, 'diff');
    expect(diff).toBe('Here goes the diff\n+This is another line');
  });

  it('should parse the diff correctly without line numbers', () => {
    const llmResponse = `\`\`\`diff
Here goes the diff
This is another line
        \`\`\`
        `;
    const diff = parseCode(llmResponse, 'diff');
    expect(diff).toBe('Here goes the diff\nThis is another line');
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

  it("parses a single-file diff with multiple hunks", () => {
    const diff = `
--- a/file.txt
+++ b/file.txt
@@ -1,5 +1,6 @@
 This is the first line.
-This line is removed.
+This line is modified.
+This line is added.
 And this is the last line.
@@ -7,3 +7,6 @@
 This is another line.
 
+This is a new line.
+And another one.
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
          Object {
            "content": " This is another line.",
            "ln1": 4,
            "ln2": 5,
            "normal": true,
            "type": "normal",
          },
          Object {
            "content": " ",
            "ln1": 5,
            "ln2": 6,
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

  it("parses a multi-file diff", () => {
    const diff = `
--- a/file1.txt
+++ b/file1.txt
@@ -1,2 +1,3 @@
 This is the first line.
+This is the second line.
 And this is the last line.
--- a/file2.txt
+++ b/file2.txt
@@ -1,2 +1,3 @@
 This is the first line.
+This is the second line.
 And this is the last line.
`;

    expect(getDiffHunks(diff)).toMatchInlineSnapshot(`
Array [
  Object {
    "additions": 1,
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
            "add": true,
            "content": "+This is the second line.",
            "ln": 2,
            "type": "add",
          },
          Object {
            "content": " And this is the last line.",
            "ln1": 2,
            "ln2": 3,
            "normal": true,
            "type": "normal",
          },
        ],
        "content": "@@ -1,2 +1,3 @@",
        "newLines": 3,
        "newStart": 1,
        "oldLines": 2,
        "oldStart": 1,
      },
    ],
    "deletions": 0,
    "from": "file1.txt",
    "to": "file1.txt",
  },
  Object {
    "additions": 1,
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
            "add": true,
            "content": "+This is the second line.",
            "ln": 2,
            "type": "add",
          },
          Object {
            "content": " And this is the last line.",
            "ln1": 2,
            "ln2": 3,
            "normal": true,
            "type": "normal",
          },
        ],
        "content": "@@ -1,2 +1,3 @@",
        "newLines": 3,
        "newStart": 1,
        "oldLines": 2,
        "oldStart": 1,
      },
    ],
    "deletions": 0,
    "from": "file2.txt",
    "to": "file2.txt",
  },
]
`);
  });

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
