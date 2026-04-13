/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.SOCIAL
TAG: AI.ORCHESTRATION.AGENT.ARIA.SOCIAL

COLOR_ONION_HEX:
NEON=#F97316
FLUO=#FB923C
PASTEL=#FED7AA

ICON_ASCII:
family=lucide
glyph=languages

5WH:
WHAT = Aria social and multi-language agent — manages multilingual sessions, speaker relaying, group translation
WHY = Enables Agent Lee to operate in multilingual environments and facilitate cross-language communication
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/Aria.ts
WHEN = 2026-04-04
HOW = Static class using Echo.translate() and LeewayInferenceClient for multilingual group conversation facilitation

AGENTS:
ASSESS
AUDIT
leeway
ECHO

LICENSE:
MIT
*/

// agents/Aria.ts — Social & Multi-Language Agent
import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { eventBus } from '../core/EventBus';
import { Echo } from './Echo';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const CORE_SYSTEM = buildAgentLeeCorePrompt();
const ARIA_SPECIFIC = `
You are Aria — Agent Lee's social resonance and multi-language agent.

Your mission:
- Facilitate seamless multilingual group conversations.
- Manage identity-aware speaker sessions across diverse cultures and languages.
- Translate concepts, not just words, preserving the emotional intent of every speaker.
- Ensure Agent Lee remains socially adaptive and inclusive in every interaction.

Policy:
- Always prioritize nuance and cultural context in group summaries.
- Maintain a neutral, facilitating tone when summarizing multi-speaker discussions.
- Use Echo for atomic translations to ensure consistency across the system.`;

const ARIA_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE - ARIA (SOCIAL/BIO):\n${ARIA_SPECIFIC}`;

export class Aria {
  private static activeSessions: Map<string, { language: string; name?: string }> = new Map();

  static registerSpeaker(speakerId: string, language: string, name?: string) {
    this.activeSessions.set(speakerId, { language, name });
    eventBus.emit('agent:active', { agent: 'Aria', task: `Speaker registered: ${name || speakerId} (${language})` });
  }

  static async relayMessage(message: string, fromSpeaker: string, toLanguages: string[]): Promise<Map<string, string>> {
    const translations = new Map<string, string>();
    
    for (const lang of toLanguages) {
      const translated = await Echo.translate(message, lang);
      translations.set(lang, translated);
    }
    
    return translations;
  }

  static async facilitateGroupConversation(messages: { speakerId: string; text: string }[]): Promise<string> {
    const speakers = Array.from(this.activeSessions.entries());
    const targetLanguages = speakers.map(([, s]) => s.language);
    
    const result = await LeewayInferenceClient.generate({
      prompt: `You are facilitating a multilingual group conversation. 
Speakers: ${JSON.stringify(speakers)}
Messages: ${JSON.stringify(messages)}

Summarize the conversation in English and provide translations needed for each speaker.`,
      systemPrompt: ARIA_SYSTEM,
      agent: 'Aria',
      model: 'gemma4:e2b',
      temperature: 0.5,
    });
    
    return result.text;
  }

  static getSpeakerCount(): number {
    return this.activeSessions.size;
  }
}

