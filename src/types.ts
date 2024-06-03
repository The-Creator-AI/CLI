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
    buildPrompt: (context: PromptConfigContext) => Promise<{
        responseType: 'text/plain' | 'application/json';
        prompt: string;
    }>;
    handleResponse: (context: PromptConfigContext) => Promise<void>;
}
