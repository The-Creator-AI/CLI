import inquirer from 'inquirer';

export interface PromptConfigContext {
    rootDir: string;
    codeContent: string;
    ask: (questions: inquirer.Question[]) => Promise<any>;
    copyToClipboard: (content: any) => void;
    log: (message: any) => void;
    applyCodeDiff: (context: PromptConfigContext) => Promise<void>;
    runPrompt: (config: PromptConfig, _context?: PromptConfigContext) => Promise<void>;
    prompt: string;
    response: string;
    data?: any;
}

export interface PromptConfig {
    label: string; // Label for the prompt
    rootDir: string; // Path to the project folder
    responseType: 'text/plain' | 'application/json';
    prePrompt: (context: PromptConfigContext) => Promise<string>; // Function to generate a pre-prompt
    postPrompt: (context: PromptConfigContext) => Promise<string>; // Function to generate a post-prompt
    processContent: (context: PromptConfigContext) => Promise<string>; // Function to process the project content
    handleResponse: (context: PromptConfigContext) => Promise<void>; // Function to handle the LLM response
}
