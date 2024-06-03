import inquirer from 'inquirer';

export interface AgentContext {
    rootDir: string;
    codeContent: string;
    ask: (questions: inquirer.Question[]) => Promise<any>;
    copyToClipboard: (content: any) => void;
    log: (message: any) => void;
    applyCodeDiff: (context: AgentContext) => Promise<void>;
    runPrompt: (config: Agent, _context?: AgentContext) => Promise<void>;
    prompt: string;
    response: string;
    data?: any;
}

export interface Agent {
    name: string; // Label for the prompt
    rootDir: string; // Path to the project folder
    buildPrompt: (context: AgentContext) => Promise<{
        responseType: 'text/plain' | 'application/json';
        prompt: string;
    }>;
    handleResponse: (context: AgentContext) => Promise<void>;
}
