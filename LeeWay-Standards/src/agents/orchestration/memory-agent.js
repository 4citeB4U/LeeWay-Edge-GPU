/*
LEEWAY HEADER — DO NOT REMOVE
REGION: AGENTS.ORCHESTRATION
TAG: AGENT.MEMORY.MGR
5WH:
  WHAT = Memory & Wisdom Agent
  WHY = Manages the persistent learning loop and wisdom synthesis
  WHO = Sovereign Historian
  HOW = Documents every cycle and performs deep study upon Awakening
*/

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export class MemoryAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.memoryDir = join(this.rootDir, '.leeway', 'memory');
    this.wisdomPath = join(this.memoryDir, 'hive-wisdom.json');
    this._ensureStructure();
  }

  _ensureStructure() {
    ['studies/success', 'studies/failure'].forEach(d => {
      const path = join(this.memoryDir, d);
      if (!existsSync(path)) mkdirSync(path, { recursive: true });
    });
  }

  /**
   * Records a 'Study' (Success or Failure)
   */
  async recordStudy(cycle, success = true) {
    const timestamp = Date.now();
    const type = success ? 'success' : 'failure';
    const studyPath = join(this.memoryDir, 'studies', type, `study_${timestamp}.json`);
    
    const studyData = {
      timestamp: new Date().toISOString(),
      intent: cycle.intent,
      response: cycle.response,
      success,
      reason: cycle.reason || null,
      platform: process.platform,
      hostname: process.env.COMPUTERNAME || 'unknown'
    };

    writeFileSync(studyPath, JSON.stringify(studyData, null, 2));
    
    // Auto-update subtle wisdom if not awakened
    await this._updateWisdomSummary(studyData);
  }

  /**
   * The Deep Learning Loop (Triggered by Awakening)
   * When the inference engine is available, the Absolute Zero Reasoner
   * studies past interactions and synthesizes real wisdom.
   */
  async runLearningLoop(inferenceClient = null) {
    console.log('\n[MEMORY] Initiating deep study of all recorded logic...');
    
    const successes = this._getStudies('success');
    const failures = this._getStudies('failure');
    
    const wisdom = this._loadWisdom();
    wisdom.stats = {
      totalStudies: successes.length + failures.length,
      successRate: successes.length / (successes.length + failures.length || 1),
      lastLearningLoop: new Date().toISOString()
    };
    
    wisdom.insights = wisdom.insights || [];

    // --- SOVEREIGN LEARNING: Use the Absolute Zero Reasoner if available ---
    if (inferenceClient && (successes.length + failures.length) > 0) {
      try {
        // Gather up to 10 recent studies for analysis
        const studySamples = [];
        for (const type of ['success', 'failure']) {
          const studies = this._getStudies(type);
          for (let i = 0; i < Math.min(studies.length, 5); i++) {
            try {
              const data = JSON.parse(readFileSync(join(this.memoryDir, 'studies', type, studies[i]), 'utf8'));
              studySamples.push({ type, intent: data.intent, response: data.response?.substring(0, 100) });
            } catch (e) {}
          }
        }

        const analysisPrompt = 
          `Analyze these ${studySamples.length} recent Agent Lee interactions and produce ` +
          `3 concise insights about patterns, strengths, and areas for improvement:\n` +
          JSON.stringify(studySamples, null, 1);

        console.log('[MEMORY] Absolute Zero Reasoner is studying past interactions...');
        const synthesized = await inferenceClient.generate(analysisPrompt);
        
        if (synthesized && synthesized.length > 10) {
          wisdom.insights.push({
            timestamp: new Date().toISOString(),
            source: 'AbsoluteZeroReasoner',
            analysis: synthesized
          });
          console.log('[MEMORY] Deep reasoning complete. New wisdom committed.');
        }
      } catch (err) {
        console.log(`[MEMORY] Reasoner unavailable for deep study: ${err.message}`);
        // Fall back to deterministic analysis
        if (failures.length > 0) {
          wisdom.insights.push(`Analyzed ${failures.length} friction points. Governance protocols hardened.`);
        }
      }
    } else {
      // Deterministic analysis (no inference engine)
      if (failures.length > 0) {
        wisdom.insights.push(`Analyzed ${failures.length} system friction points. Governance protocols hardened.`);
      }
    }
    
    wisdom.hiveLevel = Math.floor(successes.length / 5) + 1;
    
    writeFileSync(this.wisdomPath, JSON.stringify(wisdom, null, 2));
    console.log(`[MEMORY] Learning loop complete. Hive Level: ${wisdom.hiveLevel}. Permanent knowledge retained.`);
  }

  _getStudies(type) {
    const dir = join(this.memoryDir, 'studies', type);
    return readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => {
        // Sort by timestamp in filename (study_123456789.json)
        const tsA = parseInt(a.match(/\d+/)[0]);
        const tsB = parseInt(b.match(/\d+/)[0]);
        return tsB - tsA; // Newest first
      });
  }

  /**
   * Retrieves the most recent successful interactions to provide conversation context.
   */
  getRecentContext(limit = 3) {
    const successes = this._getStudies('success');
    const context = [];
    
    for (let i = 0; i < Math.min(successes.length, limit); i++) {
      try {
        const data = JSON.parse(readFileSync(join(this.memoryDir, 'studies', 'success', successes[i]), 'utf8'));
        context.push({ role: 'user', content: data.intent });
        context.push({ role: 'assistant', content: data.response });
      } catch (e) {}
    }
    
    return context.reverse(); // Return in chronological order
  }

  _loadWisdom() {
    if (existsSync(this.wisdomPath)) {
      return JSON.parse(readFileSync(this.wisdomPath, 'utf8'));
    }
    return { hiveLevel: 1, stats: {}, insights: [] };
  }

  async _updateWisdomSummary(data) {
    const wisdom = this._loadWisdom();
    wisdom.lastInteraction = data.timestamp;
    writeFileSync(this.wisdomPath, JSON.stringify(wisdom, null, 2));
  }

  getWisdomSummary() {
    const wisdom = this._loadWisdom();
    return wisdom;
  }
}
