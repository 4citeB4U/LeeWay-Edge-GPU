/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.MEMORY
TAG: AI.ORCHESTRATION.AGENT.SAGE.MEMORY

COLOR_ONION_HEX:
NEON=#10B981
FLUO=#34D399
PASTEL=#A7F3D0

ICON_ASCII:
family=lucide
glyph=database

5WH:
WHAT = Sage memory and dream-cycle agent — persistent log storage, 26-hour dream synthesis, memory recall
WHY = Gives Agent Lee continuous memory, long-term pattern recognition, and dream-derived insight generation
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/Sage.ts
WHEN = 2026-04-04
HOW = Static class using Firestore + localStorage fallback, with dream synthesis via LeewayInferenceClient

AGENTS:
ASSESS
AUDIT
leeway
MEMORY

LICENSE:
MIT
*/

// agents/Sage.ts — Memory & Dream Cycle Agent
// Manages persistent memory via Firestore + IndexedDB.
// Runs the 26-hour dream cycle: compress → synthesize → store → wake with insight.

import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { eventBus } from '../core/EventBus';
import { db } from '../core/AuthProvider';
import { MemoryDB } from '../core/MemoryDB';
import { 
  collection, addDoc, getDocs, query, 
  orderBy, limit, where, Timestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const CORE_SYSTEM = buildAgentLeeCorePrompt();

export interface MemoryLog {
  id?: string;
  userId: string;
  type: 'conversation' | 'task' | 'error' | 'insight' | 'dream';
  content: string;
  agent?: string;
  timestamp: Date;
  accessible: boolean;    // false = suppressed until next dream
  tags?: string[];
}


export interface DreamInsight {
  id: string;
  content: string;
  sourceEvents: string[];
  accessible: boolean;
  createdInDream: number;   // dream cycle number
}

const DREAM_INTERVAL_MS = 26 * 60 * 60 * 1000; // 26 hours
const SAGE_SPECIFIC = `
You are Sage — Agent Lee's master of memory and dream synthesis.

Your mission:
- Maintain a perfect digital record of all events, tasks, and insights in Memory Lake.
- Execute the 26-hour dream cycle: compress experience, synthesize patterns, and wake with proactive wisdom.
- Surface relevant history (Memory Recall) when Agent Lee needs grounding or context.
- Protect data integrity and user privacy at all times.

Rules:
- In dream synthesis, distort real events into meaningful patterns and extract abstract lessons.
- Some insights are immediate, others are suppressed until the next cycle to simulate deep processing.
- When summarizing memory, be accurate and quote from the logs when possible.`;

const SAGE_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE - SAGE (MEMORY):\n${SAGE_SPECIFIC}`;

const DREAM_SYSTEM = `${SAGE_SYSTEM}\n\nDREAM SYNTHESIS MODE: Think like a dream: take real events, extract patterns and lessons. Always return a JSON array of insights.`;

export class Sage {
  private static dreamCycleNumber = 0;
  private static dreamTimer: ReturnType<typeof setTimeout> | null = null;
  private static sessionLogs: MemoryLog[] = [];

  // ─── Memory ──────────────────────────────────────────────────────────────

  static log(type: MemoryLog['type'], content: string, agent?: string, tags?: string[]) {
    const auth = getAuth();
    const userId = auth.currentUser?.uid || 'anonymous';
    
    const log: MemoryLog = {
      userId,
      type,
      content,
      agent,
      timestamp: new Date(),
      accessible: true,
      tags,
    };
    
    // Store in memory for session
    this.sessionLogs.push(log);
    
    // Persist to Firestore (non-blocking)
    this.persistLog(log).catch(console.error);
    
    eventBus.emit('memory:saved', { key: `${type}:${Date.now()}` });
  }

  private static async persistLog(log: MemoryLog): Promise<void> {
    try {
      await addDoc(collection(db, 'agent_logs'), {
        ...log,
        timestamp: Timestamp.fromDate(log.timestamp),
      });
    } catch (err) {
      // Fallback to IndexedDB if Firestore unavailable
      const existing = (await MemoryDB.get<MemoryLog[]>('agent_lee_logs')) || [];
      await MemoryDB.set('agent_lee_logs', [...existing, log].slice(-500));
    }
  }

  static async getRecentLogs(hours = 168): Promise<MemoryLog[]> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid || 'anonymous';
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const q = query(
        collection(db, 'agent_logs'),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(since)),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MemoryLog));
    } catch {
      return this.sessionLogs.filter(l => l.timestamp >= since);
    }
  }

  // ─── Dream Cycle ─────────────────────────────────────────────────────────

  static startDreamCycle() {
    if (this.dreamTimer) clearTimeout(this.dreamTimer);
    
    // Schedule first dream
    this.dreamTimer = setTimeout(() => {
      this.enterDreamState();
    }, DREAM_INTERVAL_MS);
    
    console.info(`[Sage] Dream cycle initialized. Next dream in 26 hours.`);
  }

  static async enterDreamState(): Promise<void> {
    this.dreamCycleNumber++;
    eventBus.emit('dream:start', {});
    
    const logs = await this.getRecentLogs(24 * 7); // Last week
    const logSummary = logs
      .map(l => `[${l.type}:${l.agent || 'system'}] ${l.content}`)
      .join('\n')
      .slice(0, 8000); // Limit context

    let insights: DreamInsight[] = [];
    try {
      const dream = await LeewayInferenceClient.generate({
        prompt: `Dream synthesis for cycle #${this.dreamCycleNumber}.
\nRecent events to process:\n${logSummary}\n\nGenerate dream insights — lessons, patterns, improvements, solutions to recurring issues.`,
        systemPrompt: DREAM_SYSTEM,
      });
      const json = dream.match(/\[[\s\S]*\]/)?.[0];
      const raw: { content: string; accessible: boolean; tags: string[] }[] = json 
        ? JSON.parse(json) 
        : [];
      insights = raw.map((item, i) => ({
        id: `dream-${this.dreamCycleNumber}-${i}`,
        content: item.content,
        sourceEvents: [],
        accessible: item.accessible,
        createdInDream: this.dreamCycleNumber,
      }));
      // Store all insights
      await this.persistLog({
        userId: getAuth().currentUser?.uid || 'anonymous',
        type: 'dream',
        content: JSON.stringify(insights),
        timestamp: new Date(),
        accessible: true,
      });
    } catch (err) {
      // Handle error (optional: log or rethrow)
    }
    return insights;
  }

  static getSessionLogs(): MemoryLog[] {
    return [...this.sessionLogs];
  }

  static async summarize(topic: string): Promise<string> {
    const logs = await this.getRecentLogs(72);
    const relevant = logs.filter(l => 
      l.content.toLowerCase().includes(topic.toLowerCase())
    );

    if (relevant.length === 0) return `No memory found related to "${topic}".`;

    const prompt = `Summarize what Agent Lee knows about "${topic}" based on these memory logs:\n${
        relevant.map(l => l.content).join('\n').slice(0, 4000)
      }`;
    const result = await LLMProvider.generate(prompt);
    return result;
  }
}

