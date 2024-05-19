This file defines functions related to ignoring files and directories during processing.

### Functions:

* **`ensureIgnoreFileExists(dir: string)`:**
  - Ensures that an `ignore.llm` file exists in the specified directory.
  - If no `ignore.llm` file exists, it creates one based on the contents of the `.gitignore` file in the same directory, adding any missing entries.
* **`isIgnored(filePath: string)`:**
  - Checks if the given file path is ignored based on the contents of the `.gitignore` and `ignore.llm` files in the directory hierarchy.
  - Uses a set of rules to match patterns in the ignore files against the file path.
  - If the file path matches any ignore pattern, the function returns `true`, indicating that the file is ignored.

### Usage:

```typescript
import { isIgnored } from './ignore';

// Check if a file is ignored
const isFileIgnored = isIgnored('/path/to/file.ts');

// ... further logic based on the isFileIgnored value
```

### Example:

```
// .gitignore:
node_modules
dist
*.llm

// ignore.llm:
node_modules
dist
*.llm
```

The `isIgnored` function will check for patterns in the `.gitignore` and `ignore.llm` files and return `true` for files that match any of the patterns. For example, `isIgnored('dist/index.js')` would return `true` because `dist` is included in both `.gitignore` and `ignore.llm`.
