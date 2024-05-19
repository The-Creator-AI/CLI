This file contains the main entry point for the application.

### Execution:

The script reads the project folder path from the command line arguments or uses the current working directory if no path is provided.

### Steps:

1. **Initialize FileProcessor:**
   - Create a new instance of the `FileProcessor` class using the provided folder path.
2. **Process Pre-prompt:**
   - Call the `processPrePrompt()` method on the `FileProcessor` instance to handle the pre-prompt file or use a default pre-prompt.
3. **Process Line:**
   - Call the `processLine()` method on the `FileProcessor` instance to process the project folder or the specified file path.
4. **Process Post-prompt:**
   - Call the `processPostPrompt()` method on the `FileProcessor` instance to handle the post-prompt file or use a default post-prompt.
5. **Copy Output to Clipboard:**
   - Call the `copyOutputToClipboard()` method on the `FileProcessor` instance to copy the content of the output file to the clipboard.

### Example Usage:

```bash
# Process the current working directory
node dist/index.js 

# Process a specific directory
node dist/index.js /path/to/project
```

### Code:

```typescript
import { FileProcessor } from './file-processor';

// Main execution
const folderPath = process.argv.length > 2 ? process.argv[2] : process.cwd();
const fileProcessor = new FileProcessor(folderPath);

fileProcessor.processPrePrompt(folderPath);

// Process folder
fileProcessor.processLine(folderPath);

// Process request file
fileProcessor.processPostPrompt(folderPath);

// Copy the output file to clipboard
fileProcessor.copyOutputToClipboard(folderPath); // Added this line
```
