export const PRE_PROMPT_FILE = 'system-instruction.llm';
export const POST_PROMPT_FILE = 'prompt.llm';
export const OUTPUT_FILE = 'content.llm';
export const DEFAULT_PRE_PROMPT = `I'd like to make some changes to my codebase, and I'd appreciate your help.

Instead of providing one long text with all the files, can we break it down by specific changes?

Here's what I propose:**

Describe the change: Briefly explain what you want to achieve with the code modification.
Desired outcome: Describe the expected behavior after the change.
Once you understand my goals, you can provide the modified code in the same format as the original.

This approach will allow us to work more efficiently and ensure we're on the same page.
`;
export const DEFAULT_POST_PROMPT = `Give the outline of the project.`;
export const BINARY_FILE_SIGNATURE = ['FFD8FF', '47494638'];
