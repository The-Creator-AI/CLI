// import editor from '@inquirer/editor';
import autocomplete from 'inquirer-autocomplete-standalone';
import {
    BOT,
    POST_PROMPTS_FILE
} from '../constants.js';
import type { Agent, LLMResponseType } from '../types.js';
import {
    getPreviousRecords,
    saveNewRecord
} from '../utils.js';

import { parseCode } from '../utils/code-parsing.js';

interface PlanStep {
    step_type: "design" | "implementation" | "documentation";
    description: string;
    sub_steps?: Array<SubStep>;  // Optional sub-steps
}

interface SubStep {
    step_type: string;  // More varied types for sub-steps
    description: string;
    target?: string;    // Optional target file/location
    resources?: string[]; // Optional resource links
    dependencies?: string[];  // Optional dependency descriptions
}

interface ProjectPlan {
    plan_id: string;
    task_type: string;
    project_type: string;
    key_steps: PlanStep[];
}
  
export const architect = (folderPath: string): Agent => {
    return {
        name: BOT.architect,
        rootDir: folderPath,
        buildPrompt: async (context) => {
            const responseType: LLMResponseType = 'application/json';
            let prompt = ``;
            prompt += context.codeContent;
            prompt += `\n\n\n`;
            const postPrompt: string = await autocomplete({
                message: 'What do you need me to plan?',
                source: async (input) => {
                    const prompts = getPreviousRecords(POST_PROMPTS_FILE);
                    const filteredPrompts = prompts.filter((prompt) => prompt.includes(input || ''));
                    return [
                        ...(filteredPrompts.map((prompt) => ({
                            value: prompt,
                            description: prompt
                        })) || []),
                        ...(input ? [{ value: input, description: input }] : [])
                    ];
                }
            });
            saveNewRecord(POST_PROMPTS_FILE, postPrompt as string);
            prompt += `I call upon the ${BOT.architect} to handle what user asks below -`
            prompt += `\n\n\n`;
            prompt += postPrompt.trim();
            return { responseType, prompt, };
        },
        handleResponse: async (context) => {
            const plan: ProjectPlan = JSON.parse(parseCode(context.response, 'json'));
            console.log(plan);
        }
    };
};