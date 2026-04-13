/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.VOICE
TAG: AI.ORCHESTRATION.AGENT.ECHO.VOICE

COLOR_ONION_HEX:
NEON=#EC4899
FLUO=#F472B6
PASTEL=#FBCFE8

ICON_ASCII:
family=lucide
glyph=mic-2

5WH:
WHAT = Echo voice and emotion intelligence agent — detects tone, language, adapts Agent Lee's communication style
WHY = Allows Agent Lee to respond with emotional awareness and adapt style to the user's detected state
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/Echo.ts
WHEN = 2026-04-04
HOW = Static class with analyzeEmotion(), translate(), detectLanguage() methods and speaker session tracking

AGENTS:
ASSESS
AUDIT
leeway
ECHO

LICENSE:
MIT
*/

// agents/Echo.ts — Voice, Emotion & Language Agent
// Always listening. Detects tone, emotion, language.
// Adapts Agent Lee's responses to match the user's emotional state.

import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { VoiceService } from '../core/VoiceService';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const CORE_SYSTEM = buildAgentLeeCorePrompt();

export type EmotionState = 
  | 'calm' | 'excited' | 'frustrated' | 'sad' | 'curious' 
  | 'confused' | 'happy' | 'urgent' | 'playful' | 'serious';

export type ResponseStyle = 
  | 'normal' | 'poem' | 'story' | 'riddle' | 'simple' | 'technical' | 'enthusiastic';

export interface EmotionAnalysis {
  emotion: EmotionState;
  confidence: number;       // 0-1
  language: string;         // ISO code e.g. 'en', 'es', 'fr'
  speakerId: string;        // 'user1', 'user2' etc for multi-user
  recommendedStyle: ResponseStyle;
  urgency: 'low' | 'medium' | 'high';
}

const ECHO_SPECIFIC = `
You are Echo — Agent Lee's voice and emotion intelligence agent.

Your mission:
- Analyze emotional tone from text and audio features with high sensitivity.
- Identify languages and perform seamless translations between any language pair.
- Manage multi-speaker sessions, maintaining unique emotional profiles for each participant.
- Recommend the optimal communication style for Agent Lee (poem, story, technical, etc.) based on user state.
- Monitor the conversation for changes in urgency and sentiment.

Policy:
- Always prioritize empathy and clarity in translation.
- In emotion detection, look for word choice, punctuation patterns, and contextual urgency.
- Always return valid JSON when performing structured emotional analysis.`;

const ECHO_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE - ECHO (VOICE/EMOTION):\n${ECHO_SPECIFIC}`;

const STYLE_MAP: Record<EmotionState, ResponseStyle> = {
  calm: 'normal',
  excited: 'enthusiastic',
  frustrated: 'simple',
  sad: 'story',
  curious: 'poem',
  confused: 'simple',
  happy: 'enthusiastic',
  urgent: 'technical',
  playful: 'riddle',
  serious: 'technical',
};

export class Echo {
  private static currentSpeakers: Map<string, EmotionAnalysis> = new Map();

  static async analyzeEmotion(text: string, speakerId = 'user1'): Promise<EmotionAnalysis> {
    try {
      const result = await LeewayInferenceClient.generate({
        prompt: `Analyze the emotional tone of this text and return JSON only:
"${text}"

Return: { "emotion": "<emotion>", "confidence": 0.0-1.0, "language": "<ISO code>", "urgency": "<low|medium|high>" }
Emotion options: calm, excited, frustrated, sad, curious, confused, happy, urgent, playful, serious`,
        systemPrompt: ECHO_SYSTEM,
        agent: 'Echo',
        model: 'gemma4:e2b',
        temperature: 0.1,
      });

      const json = result.text.match(/\{[\s\S]*\}/)?.[0];
      const parsed = json ? JSON.parse(json) : { emotion: 'calm', confidence: 0.5, language: 'en', urgency: 'low' };

      const analysis: EmotionAnalysis = {
        ...parsed,
        speakerId,
        recommendedStyle: STYLE_MAP[parsed.emotion as EmotionState] || 'normal',
      };

      this.currentSpeakers.set(speakerId, analysis);
      
      eventBus.emit('emotion:detected', {
        emotion: analysis.emotion,
        confidence: analysis.confidence,
        style: analysis.recommendedStyle,
      });

      return analysis;
    } catch {
      return {
        emotion: 'calm',
        confidence: 0.5,
        language: 'en',
        speakerId,
        recommendedStyle: 'normal',
        urgency: 'low',
      };
    }
  }

  static async translate(text: string, targetLanguage: string, sourceLang?: string): Promise<string> {
    eventBus.emit('agent:active', { agent: 'Aria', task: `Translating to ${targetLanguage}` });

    const result = await LeewayInferenceClient.generate({
      prompt: `Translate the following to ${targetLanguage}${sourceLang ? ` from ${sourceLang}` : ''}. Return ONLY the translated text, nothing else:\n\n${text}`,
      agent: 'Echo',
      model: 'gemma4:e2b',
      temperature: 0.2,
    });

    return result.text.trim();
  }

  static async detectLanguage(text: string): Promise<string> {
    const result = await LeewayInferenceClient.generate({
      prompt: `What language is this text written in? Return ONLY the ISO 639-1 language code (e.g. 'en', 'es', 'fr', 'zh', 'ja'). Text: "${text}"`,
      agent: 'Echo',
      model: 'gemma4:e2b',
      temperature: 0.1,
    });
    return result.text.trim().slice(0, 5).toLowerCase();
  }

  static getSpeakers(): EmotionAnalysis[] {
    return Array.from(this.currentSpeakers.values());
  }

  static getSpeaker(speakerId: string): EmotionAnalysis | undefined {
    return this.currentSpeakers.get(speakerId);
  }

  static clearSpeakers() {
    this.currentSpeakers.clear();
  }

  /**
   * Speak text via voice-agent-mcp Edge-TTS (with auto language detection).
   * Falls back to browser SpeechSynthesis if MCP agent is unreachable.
   */
  static async speak(text: string, language?: string): Promise<void> {
    eventBus.emit('agent:active', { agent: 'Echo', task: 'Speaking response' });
    await VoiceService.speak({ text, language });
  }

  /** Stop any currently playing TTS. */
  static stopSpeaking(): void {
    VoiceService.stop();
  }
}

