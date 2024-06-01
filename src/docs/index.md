## Refactor `src/index.ts` Execution Flow

This spec document outlines a refactor of the main execution flow in `src/index.ts` to improve its organization and clarity. The current approach with nested `if` statements and asynchronous callbacks makes the code harder to understand and maintain. 

The goal is to break down the execution into smaller, more manageable functions, making the code more modular and easier to test. 

### Current Execution Flow Issues

- **Complex Nesting:** The current execution flow is deeply nested, using multiple `if` statements and nested callbacks, making it hard to understand. 
- **Tight Coupling:** The logic for asking the user questions, handling their responses, and retrying in case of issues is all intertwined in the main flow.
- **Limited Testability:** The complex structure makes it challenging to write effective unit tests for specific parts of the execution flow.

### Proposed Refactoring

We will break down the main execution flow into smaller functions, each responsible for a specific part of the process:

- **`handleLLMInteraction`:**  This function will manage the interaction with the LLM, including sending the code, receiving the response, parsing the diff, applying the diff, and handling potential issues.
- **`checkDiffCorrectness`:**  This function will ask the user to validate the diff and handle their response, prompting for a complete diff or a better diff as needed.
- **`checkDiffCompleteness`:** This function will ask the user if the diff is complete, if not llm will be requested for the remaining changes.

### Detailed Changes

**`src/index.ts`:**

- **Remove:** The nested `if` statement structure and the asynchronous callbacks within it.
- **Replace:** The current flow with a series of calls to the newly created functions.

**New Functions:**

- **`handleLLMInteraction`:**
    - Send the code to the LLM using `sendToLLM`.
    - Parse the diff from the LLM response using `parseDiff`.
    - Apply the diff using `applyDiff`.
    - If the diff is not correct, call `requestBetterDiff`.
    - If the diff is not complete, call `requestCompleteDiff`.
    - Handle any potential errors during these steps.
- **`checkDiffCorrectness`:**
    - Ask the user to confirm if the diff is correct.
    - Handle the user's responses and return the appropriate validation results. 
- **`checkDiffCompleteness`:**
    - Ask the user to confirm if the diff is correct.
    - Handle the user's responses and return the appropriate validation results. 

### Additional Considerations

- **Error Handling:** Ensure robust error handling within the new functions for all potential issues.
- **Testing:** Create comprehensive unit tests for the new functions to ensure their correctness and isolation.

