/*
LEEWAY HEADER — DO NOT REMOVE
REGION: MEMORY
TAG: CORE.MEMORY.SYSTEM
5WH:
  WHAT = 3-Tier memory system (Episodic, Semantic, Procedural)
  WHY = Provides long-term learning and pattern recognition
  WHO = LeeWay Innovations
*/

import fs from 'fs';
import path from 'path';

export class MemorySystem {
  private episodic: any[] = [];
  private semantic: Map<string, any> = new Map();
  private procedural: Map<string, any> = new Map();
  private readonly STORAGE_PATH = path.join(process.cwd(), 'memory');

  constructor() {
    if (!fs.existsSync(this.STORAGE_PATH)) {
      fs.mkdirSync(this.STORAGE_PATH, { recursive: true });
    }
    this.load();
  }

  logEvent(event: any) {
    const entry = {
      ...event,
      timestamp: Date.now()
    };
    this.episodic.push(entry);
    console.log(`🧠 MEMORY: Logged episodic event: ${event.intent || 'unnamed'}`);
    this.save();
  }

  learnPattern(key: string, pattern: any) {
    this.semantic.set(key, pattern);
    this.save();
  }

  saveProcedure(name: string, steps: string[]) {
    this.procedural.set(name, steps);
    this.save();
  }

  getProcedure(name: string) {
    return this.procedural.get(name);
  }

  private save() {
    try {
      fs.writeFileSync(path.join(this.STORAGE_PATH, 'episodic.json'), JSON.stringify(this.episodic, null, 2));
      fs.writeFileSync(path.join(this.STORAGE_PATH, 'semantic.json'), JSON.stringify(Object.fromEntries(this.semantic), null, 2));
      fs.writeFileSync(path.join(this.STORAGE_PATH, 'procedural.json'), JSON.stringify(Object.fromEntries(this.procedural), null, 2));
    } catch (err) {
      console.error("❌ MEMORY_SAVE_ERROR:", err.message);
    }
  }

  private load() {
    try {
      const ePath = path.join(this.STORAGE_PATH, 'episodic.json');
      const sPath = path.join(this.STORAGE_PATH, 'semantic.json');
      const pPath = path.join(this.STORAGE_PATH, 'procedural.json');

      if (fs.existsSync(ePath)) this.episodic = JSON.parse(fs.readFileSync(ePath, 'utf8'));
      if (fs.existsSync(sPath)) this.semantic = new Map(Object.entries(JSON.parse(fs.readFileSync(sPath, 'utf8'))));
      if (fs.existsSync(pPath)) this.procedural = new Map(Object.entries(JSON.parse(fs.readFileSync(pPath, 'utf8'))));
    } catch (err) {
      console.warn("⚠️ MEMORY_LOAD_WARNING: Starting with fresh memory.");
    }
  }
}

