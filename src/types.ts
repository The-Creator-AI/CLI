import inquirer from 'inquirer';

export interface PromptConfigContext {
    rootDir: string;
    codeContent: string;
    ask: (questions: inquirer.Question[]) => Promise<any>;
    copyToClipboard: (content: any) => void;
    log: (message: any) => void;
    getCodeBlockFromResponse: (diff: any) => Promise<string>;
    applyCodeDiff: (diff: any) => Promise<void>;
    runPrompt: (config: PromptConfig) => Promise<void>;
}

export interface PromptConfig {
    rootDir: string; // Path to the project folder
    responseType: 'text/plain' | 'application/json';
    prePrompt: (context: PromptConfigContext) => Promise<string>; // Function to generate a pre-prompt
    postPrompt: (context: PromptConfigContext) => Promise<string>; // Function to generate a post-prompt
    processContent: (context: PromptConfigContext) => Promise<string>; // Function to process the project content
    handleResponse: (llmResponse: string, context: PromptConfigContext) => Promise<void>; // Function to handle the LLM response
}
