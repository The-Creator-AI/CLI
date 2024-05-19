This file contains utility functions for processing files and directories within the project.

### Functions:

* **`initializeOutputFile(folderPath: string)`:**  
  - Creates an empty output file at the specified path.
  - Returns the path to the created output file.
* **`processPrePrompt(folderPath: string, outputFile: string)`:**
  - Reads and appends the pre-prompt from `system-instruction.llm` or uses a default pre-prompt.
  - Appends the pre-prompt to the specified output file.
* **`processPostPrompt(folderPath: string, outputFile: string)`:**
  - Reads and appends the post-prompt from `prompt.llm` or uses a default post-prompt.
  - Appends the post-prompt to the specified output file.
* **`writeEmptyLines(outputFile: string)`:**  
  - Writes two empty lines to the output file.
* **`processLine(filePath: string, outputFile: string)`:**
  - Processes a single file or directory path.
  - Displays item details (relative path) and writes the content of files to the output file.
* **`displayItem(filePath: string, outputFile: string)`:**
  - Displays the details of a single item and processes it recursively for directories.
* **`processDirectory(dirPath: string, outputFile: string)`:**
  - Recursively processes a directory, ignoring ignored files.
* **`processFile(filePath: string, outputFile: string)`:**
  - Processes a single file, writing its relative path and content to the output file.
* **`isBinaryFile(filePath: string)`:**
  - Checks if a file is binary based on its hex signature.
* **`writeRelativePath(filePath: string, outputFile: string, suffix: string = '')`:**
  - Writes the relative path of a file to the output file.
* **`writeFileContent(filePath: string, outputFile: string)`:**
  - Writes the content of a file to the output file.
* **`copyOutputToClipboard(outputFile: string)`:**
  - Copies the content of the output file to the user's clipboard.

### Example Usage:

```typescript
import { initializeOutputFile, processPrePrompt, processLine, copyOutputToClipboard } from './file-processor';

// Initialize the output file
const outputFile = initializeOutputFile('/path/to/project');

// Process the pre-prompt
processPrePrompt('/path/to/project', outputFile);

// Process a file or directory
processLine('/path/to/file.ts', outputFile);

// Copy the output to the clipboard
copyOutputToClipboard(outputFile);
