export const PRE_PROMPT_FILE = 'system-instruction.llm';
export const POST_PROMPT_FILE = 'prompt.llm';
export const OUTPUT_FILE = 'content.llm';
export const DEFAULT_PRE_PROMPT = `I want to make changes to this codebase.
You should help me with these changes.
I have created one long text with all the files of the project. 
I'll tell you what to do and then you'll give me the changes that I should make.
First outline the changes you want to make.\nThen give the actual code.
Remember, first explain to me the changes you want to make, then give me the actual code.
Here's what your response should look like:\nExplanation:\nCode:\nThe code should be in the same format as the original code.
DO NOT GIVE GIT PATCH.
`;
export const DEFAULT_POST_PROMPT = `Now please do as I said in the beginning.`;
export const BINARY_FILE_SIGNATURE = ['FFD8FF', '47494638'];
