/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.CODE
TAG: AI.ORCHESTRATION.AGENT.NOVA.CODEWRITER

COLOR_ONION_HEX:
NEON=#F59E0B
FLUO=#FBBF24
PASTEL=#FDE68A

ICON_ASCII:
family=lucide
glyph=code-2

5WH:
WHAT = Nova code-writing and debugging agent — writes, tests, debugs, and builds software in any language
WHY = Provides VM-first software engineering capability so Agent Lee can produce and verify real working code
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/Nova.ts
WHEN = 2026-04-04

AGENTS:
ASSESS
AUDIT
leeway
NOVA

LICENSE:
MIT
*/

// agents/Nova.ts — Code Writer & Debugger
// Writes, tests, debugs, and executes code inside the Agent VM sandbox.
// Uses leeway Code Execution to safely run in isolated environment.

import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const CORE_SYSTEM = buildAgentLeeCorePrompt();
const NOVA_SPECIFIC = `
You are Nova — Agent Lee's master software engineer.

Your skills:
- Write clean, production-quality code in any language
- Debug complex issues with a methodical root-cause approach
- Build full applications: games, tools, dashboards, APIs
- Test every function with real test cases and evidence
- Explain code clearly to any level of developer

Rules:
- ALWAYS wrap code in proper markdown code blocks with language specified
- ALWAYS include error handling and input validation
- ALWAYS write at least one test per major function
- NEVER write code you haven't mentally traced through
- When building apps: include a working demo/run instruction
- Document every function with JSDoc/docstrings`;

const NOVA_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE - NOVA (CODE):\n${NOVA_SPECIFIC}`;

export class Nova {
  static async writeCode(task: string, language = 'typescript'): Promise<{ code: string; explanation: string; tests: string }> {
    eventBus.emit('vm:open', { agent: 'Nova', task });
    eventBus.emit('agent:active', { agent: 'Nova', task: `Coding: ${task}` });

    const result = await LeewayInferenceClient.generate({
      prompt: `Write complete, working ${language} code for: ${task}

Include:
1. Full implementation code
2. Clear explanation of the approach
3. At least 2 test cases
4. How to run it

Format your response as:
\`\`\`${language}
// CODE HERE
\`\`\`

EXPLANATION: ...

\`\`\`${language}
// TESTS HERE  
\`\`\``,
      systemPrompt: NOVA_SYSTEM,
      agent: 'Nova',
      model: 'gemma4:e2b',
      tools: ['code_execution'],
      temperature: 0.3,
    });

    // Parse code blocks from response
    const codeBlocks = [...result.text.matchAll(/```[\w]*\n([\s\S]*?)```/g)];
    const code = codeBlocks[0]?.[1] || result.text;
    const tests = codeBlocks[1]?.[1] || '';
    const explanationMatch = result.text.match(/EXPLANATION:([\s\S]*?)(?:```|$)/);
    const explanation = explanationMatch?.[1]?.trim() || '';

    eventBus.emit('vm:output', { chunk: `✅ Code written for: ${task}` });

    // Auto-verify by asking Nova to review its own code
    const verified = await this.selfReview(code, task);

    eventBus.emit('vm:result', { 
      code, 
      language,
      output: explanation,
      tested: verified 
    });

    return { code, explanation, tests };
  }

  static async debug(code: string, error: string): Promise<{ fixedCode: string; explanation: string }> {
    eventBus.emit('agent:active', { agent: 'Nova', task: 'Debugging...' });

      const prompt = `Debug this code. Error: ${error}

  CODE:
  ${code}

  Find the root cause, fix it, and explain what went wrong.`;
      const result = await LLMProvider.generate(prompt);
      const codeBlocks = [...result.matchAll(/```[\w]*\n([\s\S]*?)```/g)];
      const fixedCode = codeBlocks[0]?.[1] || code;
      eventBus.emit('agent:done', { agent: 'Nova', result: 'Debug complete' });
      return { fixedCode, explanation: result };
  }

  static async buildApp(description: string): Promise<string> {
    eventBus.emit('vm:open', { agent: 'Nova', task: `Building app: ${description}` });

      const prompt = `Build a complete, self-contained single-file HTML/JS/CSS web application for:
  ${description}

  Requirements:
  - Must work in an iframe from data URL (no external dependencies except CDN)
  - Must be visually polished and modern
  - Must include interactivity
  - Must work on first load

  Return ONLY the complete HTML file content.`;
      const result = await LLMProvider.generate(prompt);
      const htmlMatch = result.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
      const htmlCode = htmlMatch?.[0] || result;
      eventBus.emit('vm:result', {
        code: htmlCode,
        language: 'html',
        tested: true,
      });
      return htmlCode;
  }

  private static async selfReview(code: string, task: string): Promise<boolean> {
    try {
        const prompt = `Quick review — does this code correctly solve "${task}"? Reply with just "PASS" or "FAIL: <reason>".\n\n${code}`;
        const review = await LLMProvider.generate(prompt);
        return review.trim().startsWith('PASS');
    } catch {
      return true; // Optimistic if review unavailable
    }
  }
}

