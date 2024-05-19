/Users/pulkitsingh/dev/context-ai/src/file-processor.md
This file contains the `FileProcessor` class, which is responsible for processing files and directories within the project.

### Class: FileProcessor

The `FileProcessor` class handles the following operations:

* **Initialization:**  
  - Constructs a new instance with the project folder path.
  - Initializes the output file (`content.llm`).
* **Pre-prompt processing:**
  - Reads and appends the pre-prompt from `system-instruction.llm` or uses a default pre-prompt.
* **Post-prompt processing:**
  - Reads and appends the post-prompt from `prompt.llm` or uses a default post-prompt.
* **File/Directory processing:** 
  - Recursively processes directories and ignores files based on the `ignore.llm` file.
  - Displays item details (relative path) and writes the content of files to the output file.
* **Binary file detection:**
  - Uses a list of common binary file signatures to identify binary files and avoid writing their content to the output file.
* **Output file to clipboard:**
  - Copies the content of the output file (`content.llm`) to the user's clipboard.

### Methods:

* **`initializeOutputFile()`:** Creates an empty output file at the specified path.
* **`processPrePrompt()`:** Handles the pre-prompt, reading it from a file or using a default pre-prompt.
* **`processPostPrompt()`:** Handles the post-prompt, reading it from a file or using a default post-prompt.
* **`writeEmptyLines()`:** Writes two empty lines to the output file.
* **`processLine()`:** Processes a single file or directory path.
* **`displayItem()`:** Displays the details of a single item and processes it recursively for directories.
* **`processDirectory()`:** Recursively processes a directory, ignoring ignored files.
* **`processFile()`:** Processes a single file, writing its relative path and content to the output file.
* **`isBinaryFile()`:** Checks if a file is binary based on its hex signature.
* **`writeRelativePath()`:** Writes the relative path of a file to the output file.
* **`writeFileContent()`:** Writes the content of a file to the output file.
* **`copyOutputToClipboard()`:** Copies the content of the output file to the clipboard.

### Example Usage:

```typescript
// Create a new FileProcessor instance
const fileProcessor = new FileProcessor('/path/to/project');

// Process the pre-prompt
fileProcessor.processPrePrompt('/path/to/project');

// Process a file or directory
fileProcessor.processLine('/path/to/file.ts');

// Copy the output to the clipboard
fileProcessor.copyOutputToClipboard('/path/to/project');
```