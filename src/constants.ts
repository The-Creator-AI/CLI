export const WHITELIST_FILE = 'whitelist.patch-ai';
export const REQUEST_FILE = 'request.patch-ai';
export const OUTPUT_FILE = 'tree_structure.txt';
export const AI_PROMPT = `I want to make changes to this codebase. You should help me with these changes.\nI have created one long text with all the files of the project. \nI'll tell you what to do and then you'll give me the changes that I should make.\nFirst outline the changes you want to make.\nThen give the actual code.\nRemember, first explain to me the changes you want to make, then give me the actual code.\nHere's what your response should look like:\nExplanation:\nCode:\nThe code should be in the same format as the original code. DO NOT GIVE GIT PATCH.\n`;
export const BINARY_FILE_SIGNATURE = ['FFD8FF', '47494638'];
