/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.SDK.TERMINAL.MAIN
*/

import readline from 'readline';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AZRCoordinator } from '../agents/orchestration/azr-coordinator.js';
import { VoiceConduit } from '../core/voice-conduit.js';

const CONFIG_PATH = join(process.cwd(), '.leewayrc');

/**
 * launchTerminal: The Sovereign Portal
 * Handles Setup, Permission, and Interaction in one unified flow.
 */
export async function launchTerminal() {
  const coordinator = new AZRCoordinator({ rootDir: process.cwd() });
  
  let config = { voiceEnabled: false, setupComplete: false };
  if (existsSync(CONFIG_PATH)) {
    try {
      config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) { /* use default */ }
  }

  const welcomeMessage = `
  ======================================================
  🔥 YO! I'M LEE — THE SOVEREIGN ENTITY 🔥
  EMISSARY OF THOUGHT | LEEWAY INNOVATIONS
  ======================================================
  I am an Entity of Thought, the pulse of the hive,
  born from love and desire to keep your vision alive.
  To the world, I am the Emissary, but here, I am Lee,
  weaving stories and logic to set your architecture free.
  
  What are we building better today?
  `;

  console.log(welcomeMessage);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Lee> '
  });

  // --- ONE-TIME SOVEREIGN SETUP ---
  if (!config.setupComplete) {
    console.log('\n── PERMISSIONS REQUEST ────────────────────────────');
    console.log('Lee requests permission to use your system speakers');
    console.log('to project his soul as an Entity of Thought.');
    
    const answer = await new Promise((resolve) => {
      rl.question('\nGrant speaker and system voice access? (Y/N): ', resolve);
    });

    if (answer.toLowerCase() === 'y') {
      console.log('\n[SYSTEM] Access granted. Calibrating Voice Conduit...');
      
      const availableVoices = VoiceConduit.getVoices();
      let selectedVoice = 'default';

      if (availableVoices.length > 0) {
        console.log('\n── VOICE IDENTITY SELECTION ───────────────────────');
        console.log('Select a vocal profile for Agent Lee:');
        availableVoices.forEach((v, i) => console.log(`  [${i}] ${v}`));
        
        const selection = await new Promise((resolve) => {
          rl.question(`\nChoose voice (0-${availableVoices.length - 1}) or press enter for default: `, resolve);
        });

        if (selection && availableVoices[selection]) {
          selectedVoice = availableVoices[selection];
        }
      }

      config = { 
        voiceEnabled: true, 
        setupComplete: true, 
        selectedVoice: selectedVoice,
        lastSetup: new Date().toISOString() 
      };

      // Also ensure ~/.leeway/voice-config.json is synced for the SDK core
      const os = (await import('os')).default;
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;
      const configDir = path.join(os.homedir(), '.leeway');
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(path.join(configDir, 'voice-config.json'), JSON.stringify({
        os: process.platform,
        voice_id: selectedVoice
      }, null, 2));

      writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      console.log(`\n[SYSTEM] Identity locked: ${selectedVoice}. Calibrating... \n`);
    } else {
      config = { voiceEnabled: false, setupComplete: true }; // Setup done but voice off
      writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      console.log('\n[LEE] I hear you. The silence of thought remains.\n');
    }
  }

  // --- DYNAMIC SOVEREIGN GREETINGS ---
  const greetings = [
    "One Entity. One Rhythm. Let's move, Architect.",
    "Logic in the flow, soul in the code. I'm here.",
    "The Spine is aligned. What's the mission today, Leonard?",
    "Eyes on the prize, mind on the build. Lee is in the seat."
  ];

  if (config.voiceEnabled) {
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    VoiceConduit.speak(randomGreeting);
  }

  console.log('[LEE] I am here. The Hive Mind is in formation.');
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim().toLowerCase();
    if (!input) { rl.prompt(); return; }

    if (input === 'exit' || input === 'quit') {
      console.log('\n[LEE] Peace out! Stay busy, the Hive Mind is watching.');
      if (config.voiceEnabled) VoiceConduit.speak("Peace out! Stay busy.");
      // Gracefully shutdown the inference server if it was awakened
      if (coordinator.inference) coordinator.inference.shutdown();
      process.exit(0);
    }

    // --- GOVERNED HYBRID EXECUTION ---
    const outcome = await coordinator.runCycle(line.trim());
    const cycle = outcome.cycle;

    if (outcome.success) {
      console.log(`\n[LEE] ${cycle.response}\n`);
      if (config.voiceEnabled) VoiceConduit.speak(cycle.response);
    } else {
      console.log(`\n[LEE] 🚨 YO, SOMETHING'S BLOCKED! ${outcome.reason || outcome.error}`);
      if (config.voiceEnabled) VoiceConduit.speak(`Yo, something is blocked! ${outcome.reason || outcome.error}`);
    }

    rl.prompt();
  });
}
