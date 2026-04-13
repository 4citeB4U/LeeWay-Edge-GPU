/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.L8
TAG: CORE.L8.SOVEREIGN_VOICE

5WH:
WHAT = SovereignVoice.ts module
WHY = Layer 8 Delivery bridge for cross-platform, non-Cloud TTS
WHO = LeeWay Industries (By Leonard Jerome Lee)
WHERE = agents/CORE/L8_Delivery/SovereignVoice.ts
WHEN = 2026
HOW = Uses native OS commands (PowerShell, say, spd-say, termux-tts) to project Agent Lee's identity

LICENSE:
MIT
*/

import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

export class SovereignVoice {
    private static config: any = null;

    private static loadConfig() {
        if (this.config) return;
        const configPath = path.join(os.homedir(), '.leeway', 'voice-config.json');
        if (fs.existsSync(configPath)) {
            try {
                this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } catch (e) {
                this.config = { method: 'default' };
            }
        } else {
            this.config = { method: 'default' };
        }
    }

    /**
     * Projects Agent Lee's voice through the native hardware layer.
     * Guaranteed 100% local and sovereign.
     */
    public static speak(text: string): void {
        if (!text) return;
        this.loadConfig();

        const cleanText = text.replace(/'/g, "").replace(/"/g, "").replace(/\n/g, ' ');
        const platform = os.platform();
        const isTermux = process.env.PREFIX && process.env.PREFIX.includes("com.termux");

        let command = '';

        if (platform === 'win32') {
            // Windows High-Fidelity Neural Bridge
            const voiceSelect = this.config.voice_id && this.config.voice_id !== 'default' 
                ? `$s.SelectVoice('${this.config.voice_id}');` 
                : '';
            command = `powershell -Command "Add-Type -AssemblyName System.speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ${voiceSelect} $s.Speak('${cleanText}')"`;
        } 
        else if (platform === 'darwin') {
            // macOS High-Fidelity Apple Voices
            const voiceFlag = this.config.voice_id && this.config.voice_id !== 'default' 
                ? `-v "${this.config.voice_id}"` 
                : '';
            command = `say ${voiceFlag} "${cleanText}"`;
        } 
        else if (isTermux) {
            // Android Native Bridge
            const engineFlag = (this.config.voice_id && this.config.voice_id !== 'default')
                ? `-e "${this.config.voice_id}"`
                : '';
            command = `termux-tts-speak ${engineFlag} "${cleanText}"`;
        } 
        else if (platform === 'linux') {
            // Linux Native Sovereign Voice
            if (this.config.method === 'spd-say') {
                command = `spd-say -t ${this.config.voice_id || 'female1'} "${cleanText}"`;
            } else {
                command = `espeak -v ${this.config.voice_id || 'en-us+m1'} "${cleanText}"`;
            }
        }

        try {
            if (command) {
                execSync(command, { stdio: 'ignore' });
            }
        } catch (err) {
            // Safety fallback if native command fails
            console.warn(`[SOVEREIGN_VOICE] Hardware projection failed: ${err.message}`);
        }
    }

    /**
     * Triggers the robotic interaction ping during agent-to-agent chatter.
     */
    public static agentPing(): void {
        let command = '';
        if (os.platform() === 'win32') {
            command = `powershell -Command "[console]::beep(800, 100)"`;
        } else {
            command = `printf "\\a"`;
        }

        try {
            execSync(command, { stdio: 'ignore' });
        } catch (err) {}
    }
}
