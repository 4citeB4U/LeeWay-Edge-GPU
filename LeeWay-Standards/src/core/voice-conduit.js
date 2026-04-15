/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.VOICE_CONDUIT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = voice-conduit module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = LeeWay-Standards\src\core\voice-conduit.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * VoiceConduit: The Sovereign Voice of Lee
 * Synchronous TTS to ensure Lee is HEARD before the system proceeds.
 */
export class VoiceConduit {
  static _getConfigPath() {
    return path.join(os.homedir(), '.leeway', 'voice-config.json');
  }

  static speak(text, rateOverride = null) {
    if (!text) return;

    // Clean text for shell safety
    const cleanText = text.replace(/'/g, "").replace(/"/g, "").replace(/\n/g, ' ');

    let selectedVoice = null;
    let method = 'default';
    let rate = rateOverride || 1; // Default neutral-fast pacing for Lee
    
    // Attempt to load the pre-configured high-quality voice
    try {
      const configPath = this._getConfigPath();
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.voice_id && config.voice_id !== 'default') {
          selectedVoice = config.voice_id;
        }
        if (config.method) method = config.method;
        if (config.rate !== undefined && rateOverride === null) rate = config.rate;
      }
      if (!selectedVoice) selectedVoice = this._detectBestVoice();
    } catch(e) {}

    let command = '';
    const isTermux = process.env.PREFIX && process.env.PREFIX.includes("com.termux");
    
    if (process.platform === 'win32') {
      command = `powershell -Command "Add-Type -AssemblyName System.speech; ` +
                `$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; ` +
                `$synth.Rate = ${rate}; ` +
                `if ('${selectedVoice}' -ne 'default') { ` +
                `  $v = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -like '*${selectedVoice}*' } | Select-Object -First 1; ` +
                `  if ($v) { $synth.SelectVoice($v.VoiceInfo.Name) } ` +
                `}; ` +
                `$synth.Speak('${cleanText}')"`;
    } else if (process.platform === 'darwin') {
      const voiceFlag = selectedVoice ? `-v "${selectedVoice}"` : '';
      command = `say ${voiceFlag} "${cleanText}"`;
    } else if (isTermux) {
      const engineFlag = selectedVoice ? `-e "${selectedVoice}"` : '';
      command = `termux-tts-speak ${engineFlag} "${cleanText}"`;
    } else {
      if (method === 'spd-say') {
        command = `spd-say -t ${selectedVoice || 'female1'} "${cleanText}"`;
      } else {
        command = `espeak -v ${selectedVoice || 'en-us+m1'} "${cleanText}"`;
      }
    }

    try {
      if (command) {
        execSync(command, { stdio: 'ignore' });
      }
    } catch (err) {}
  }

  static agentPing() {
    let command = '';
    if (process.platform === 'win32') {
      command = `powershell -Command "[console]::beep(800, 100)"`;
    } else {
      command = `printf "\\a"`;
    }
    try {
      execSync(command, { stdio: 'ignore' });
    } catch (err) {}
  }

  static getVoices() {
    let voices = [];
    try {
      if (process.platform === 'win32') {
        const cmd = `powershell -Command "Add-Type -AssemblyName System.speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo.Name }"`;
        const output = execSync(cmd).toString();
        voices = output.split(/[\r\n]+/).map(v => v.trim()).filter(v => v);
      } else if (process.platform === 'darwin') {
        const output = execSync("say -v '?'").toString();
        voices = output.split('\n').map(line => line.split('  ')[0].trim()).filter(v => v);
      } else if (process.env.PREFIX && process.env.PREFIX.includes("com.termux")) {
        const output = execSync("termux-tts-engines").toString();
        voices = output.split('\n').map(v => v.trim()).filter(v => v);
      } else {
        voices = ["female1", "male1", "en-us+m1", "en-us+f1"];
      }
    } catch (e) {
      voices = [];
    }
    return voices;
  }

  static saveVoice(voiceId, rate = 1) {
    try {
      const configDir = path.join(os.homedir(), '.leeway');
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      const configPath = this._getConfigPath();
      let config = {};
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
      config.voice_id = voiceId;
      config.rate = rate;
      config.os = process.platform;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (e) {
      return false;
    }
  }

  static _detectBestVoice() {
    const voices = this.getVoices();
    const natural = ['david', 'zira', 'samantha', 'daniel', 'serena', 'sharon', 'james'];
    for (const n of natural) {
      const found = voices.find(v => v.toLowerCase().includes(n));
      if (found) return found;
    }
    return voices[0] || 'Default';
  }
}
