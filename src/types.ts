import inquirer from 'inquirer';

export type LLMResponseType = 'text/plain' | 'application/json';
export interface AgentContext {
    chatSoFar?: string;
    ask: (questions: inquirer.Question[]) => Promise<any>;
    copyToClipboard: (content: any) => void;
    log: (message: any) => void;
    applyCodeDiff: (context: Required<Pick<AgentContext, 'lastPrompt'>> &
        Required<Pick<AgentContext, 'lastResponse'>> &
        AgentContext) => Promise<void>;
    runAgent: (config: Agent, _context?: AgentContext) => Promise<void>;
    lastPrompt?: string;
    lastResponse?: string;
    data?: any;
}

export interface Agent {
    name: string;
    buildPrompt: (context: AgentContext) => Promise<{
        responseType: LLMResponseType;
        prompt: string;
    }>;
    handleResponse: (context: Required<Pick<AgentContext, 'lastPrompt'>> &
        Required<Pick<AgentContext, 'lastResponse'>> &
        AgentContext) => Promise<void>;
}
