/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.VULCAN_COMMAND.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = vulcan-command module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = src\core\vulcan-command.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execPromise = promisify(exec);

/**
 * VulcanCommand: Adaptive Sovereign Execution
 * Dynamically probers and adapts to the host environment (PC, Pi, Edge).
 */
export class VulcanCommand {
  static async probeEnv() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      isPi: os.platform() === 'linux' && os.arch() === 'arm' // Basic Pi detection
    };
  }

  static async runSafe(command) {
    const restricted = [
      'rm -rf', 'format', 'del /s', 'shutdown', 'net user', 
      'mkfs', 'dd if=', 'chmod -R 777', ':(){ :|:& };:', 
      'powershell -command', 'cmd /c', '/dev/sda', 'reg delete'
    ];
    if (restricted.some(r => command.toLowerCase().includes(r))) {
      throw new Error(`SECURITY ALERT: Sovereign Gate Blocked - Command '${command}' is too high-risk for autonomous execution.`);
    }

    try {
      const { stdout, stderr } = await execPromise(command);
      return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Adaptive Command Generator: Maps intent to local software capabilities.
   */
  static getSystemInfoCommand(intent, env) {
    const input = intent.toLowerCase();
    
    // 1. TIME (Agnostic)
    if (input.includes('time')) {
      return env.platform === 'win32' ? 'echo %TIME%' : 'date +"%H:%M:%S"';
    }

    // 2. WEATHER (Agnostic - System Tool)
    if (input.includes('weather')) {
      return 'curl -s wttr.in/?format=3';
    }

    // 3. HARDWARE STATS (ADAPTIVE)
    if (input.includes('stats') || input.includes('status')) {
      if (env.isPi) return 'vcgencmd measure_temp; free -m'; // Pi specific
      if (env.platform === 'win32') return 'wmic cpu get loadpercentage /value';
      if (env.platform === 'linux' || env.platform === 'darwin') return 'top -bn1 | grep "Cpu(s)"';
    }

    if (input.includes('memory') || input.includes('ram')) {
      return env.platform === 'win32' ? 'wmic OS get FreePhysicalMemory' : 'free -h';
    }

    return null;
  }
}
