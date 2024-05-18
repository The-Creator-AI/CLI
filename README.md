## Explanation:

This project is a simple command-line tool that takes a folder path or a list of file paths from a whitelist.patch-ai file and generates a text file containing the content of those files (excluding binary files). The generated file can be used to provide context to a large language model (LLM) for code modification tasks.

## How it works:

1. Input: Takes a folder path or a whitelist.patch-ai file containing file paths as input.
2. File Processing: Iterates through the provided files/folders, excluding files ignored by .gitignore.
3. Output: Creates an output file tree_structure.txt containing the relative path and content of non-binary files.
4. AI Prompt: Includes a predefined AI prompt in the output file, instructing the LLM to make changes based on the provided code.
5. Clipboard: Copies the output file content to the clipboard for easy pasting into an LLM interface.

## Example Usage:
Using a folder path:
```node dist/index.js my-project-folder```

Using whitelist.patch-ai:
Create a file named whitelist.patch-ai in the project's root directory containing a list of file paths, one per line:

```
src/index.ts
src/file-processor.ts
src/constants.ts
```

Run the script:
```node dist/index.js```


## Key Features:
* File Filtering: Uses .gitignore for file exclusion.
* Binary File Detection: Skips binary files.
* Customizable AI Prompt: Allows modifying the AI prompt.
* Clipboard Integration: Simplifies copying output to LLMs.

## To use:
1. Install Dependencies:
```npm install```

2. Build the Project:
```npm run build```

3. Run the Script:
```npm start```
