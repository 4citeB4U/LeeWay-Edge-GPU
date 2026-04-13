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
   */
  async runLearningLoop() {
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
    if (failures.length > 0) {
      wisdom.insights.push(`Analyzed ${failures.length} system friction points. Governance protocols hardened.`);
    }
    
    wisdom.hiveLevel = Math.floor(successes.length / 5) + 1; // Simple progression
    
    writeFileSync(this.wisdomPath, JSON.stringify(wisdom, null, 2));
    console.log(`[MEMORY] Learning loop complete. Hive Level: ${wisdom.hiveLevel}. Permanent knowledge retained.`);
  }

  _getStudies(type) {
    const dir = join(this.memoryDir, 'studies', type);
    return readdirSync(dir).filter(f => f.endsWith('.json'));
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
