// import editor from '@inquirer/editor';
import autocomplete from 'inquirer-autocomplete-standalone';
// import { developer } from './developer.js';
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
import { runAgent } from '../remote.js';

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
            if (context.data?.badReponse) {
                prompt += `\n\n\n`;
                prompt += `Hey ${BOT.architect}, the last reponse didn't have correct structure, please give the response structure. And don't ask me further questions, just make your best guess.`
                return { responseType, prompt, };
            }
            else if (context.data?.stepToExpand) {
                prompt += `\n\n\n`;
                prompt += `I call upon the ${BOT.architect} to expand on the step below -`
                prompt += `\n\n\n`;
                prompt += context.data?.stepToExpand;
                prompt += `\n\n\n`;
                return { responseType, prompt, };
            } else {
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
            }
        },
        handleResponse: async (context) => {
            context.codeContent += `\n\n\n`;
            context.codeContent += context.response;
            context.codeContent += `\n\n\n`;
            const answers = await context.ask([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: [
                        {
                            name: 'Expand a step',
                            value: 'expand-step',
                        },
                        {
                            name: 'Request code for a step',
                            value: 'request-code',
                        },
                        {
                            name: 'Nothing, I am done',
                            value: 'done',
                        },
                    ],
                    default: 'expand-step',
                },
            ]);

            if (answers.action === 'expand-step') {
                try {
                    let plan: ProjectPlan = JSON.parse(parseCode(context.response, 'json'));
                    console.log(plan);
                    const answers = await context.ask([
                        {
                            type: 'list',
                            name: 'action',
                            message: 'What would you like to expand?',
                            choices: plan.key_steps.map((step) => ({ name: step.description, value: step.description })),
                            default: plan.key_steps[0],
                        },
                    ]);
                    context.data = {
                        plan,
                        stepToExpand: answers.action
                    };
                    console.log(`Expanding this step...\n${context.data?.stepToExpand}`);
                    await runAgent(architect(context.rootDir), context);
                } catch (e) {
                    context.data = {
                        badReponse: true,
                    };
                    await runAgent(architect(context.rootDir), context);
                }
            } else if (answers.action === 'request-code') {
                // const { stepIdToRequest } = await context.ask([{
                //     type: 'input',
                //     name: 'stepIdToRequest',
                //     message: 'Enter the step id to request code for: ',
                // }]);
                // stepId = stepIdToRequest;
                // await context.runAgent(developer(context.rootDir), { plan, stepId });
            }

            // if (stepId !== null) {
            //     await context.runPrompt(developer(context.rootDir), { plan, stepId });
            // }
        }
    };
};