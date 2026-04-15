/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.MEMORY
TAG: CORE.SOVEREIGN.MEMORY
5WH:
  WHAT = Sovereign Memory Management (L7)
  WHY = Persists user identity, preferences, and learned behaviors across sessions
  WHO = Agent Lee
  HOW = JSON-based file storage in ~/.leeway/memory.json
*/

import fs from 'fs';
import path from 'path';
import os from 'os';

export class SovereignMemory {
  constructor() {
    this.configDir = path.join(os.homedir(), '.leeway');
    this.memoryFile = path.join(this.configDir, 'sovereign-memory.json');
    this.data = this._load();
  }

  _load() {
    if (!fs.existsSync(this.configDir)) fs.mkdirSync(this.configDir, { recursive: true });
    if (!fs.existsSync(this.memoryFile)) {
      const initial = {
        user: { name: null, permissionsGranted: false },
        voice: { selected: null, history: [] },
        learned: { scripts: [], optimizations: [] },
        conversations: []
      };
      fs.writeFileSync(this.memoryFile, JSON.stringify(initial, null, 2));
      return initial;
    }
    try {
      return JSON.parse(fs.readFileSync(this.memoryFile, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  save() {
    fs.writeFileSync(this.memoryFile, JSON.stringify(this.data, null, 2));
  }

  get(path) {
    const keys = path.split('.');
    let current = this.data;
    for (const key of keys) {
      if (current[key] === undefined) return null;
      current = current[key];
    }
    return current;
  }

  set(path, value) {
    const keys = path.split('.');
    let current = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this.save();
  }

  getUserName() { return this.get('user.name'); }
  setUserName(name) { this.set('user.name', name); }
}

export const L7Memory = new SovereignMemory();
