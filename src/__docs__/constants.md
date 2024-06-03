This file defines constants used throughout the application.

### Constants:

* **PRE_PROMPT_FILE**: A string representing the filename for the pre-prompt file (default: `system-instruction.llm`). This file contains system instructions for the LLM.
* **POST_PROMPT_FILE**: A string representing the filename for the post-prompt file (default: `prompt.llm`). This file contains the prompt for the LLM.
* **OUTPUT_FILE**: A string representing the filename for the output file (default: `content.llm`). This file stores the LLM's response.
* **DEFAULT_PRE_PROMPT**: A string representing the default pre-prompt. This is a generic prompt that explains the purpose of the tool and outlines the desired format for the response.
* **DEFAULT_POST_PROMPT**: A string representing the default post-prompt. This prompt serves as a reminder for the LLM to follow the instructions provided earlier.
* **BINARY_FILE_SIGNATURE**: An array of strings representing the hex signatures of common binary file formats (JPEG and GIF). This array is used to identify binary files.

### Usage:

These constants are used throughout the application to:

* **Organize and manage file names:** This ensures consistency and reduces the potential for errors.
* **Provide default prompts:** This helps users get started quickly and easily customize the prompts if needed.
* **Identify binary files:** This ensures that binary files are handled appropriately.

### Example:

```typescript
import { PRE_PROMPT_FILE } from './constants';

// Read the pre-prompt from the specified file
const prePrompt = fs.readFileSync(PRE_PROMPT_FILE, 'utf8');