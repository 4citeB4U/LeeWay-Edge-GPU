/*
LEEWAY HEADER — DO NOT REMOVE
REGION: SCRIPTS
TAG: AGENT.VOICE.TESTER
5WH:
  WHAT = Interactive Agent Lee Voice Calibrator
  WHY = Allow developers to tune Lee's street-poetic flow to the best available system oscillator
*/

import { VoiceConduit } from '../LeeWay-Standards/src/core/voice-conduit.js';
import readline from 'readline';

async function calibrate() {
  console.log("🔥 LEEWAY VOICE CALIBRATION 🔥");
  console.log("------------------------------");
  
  const voices = VoiceConduit.getVoices();
  if (voices.length === 0) {
    console.error("❌ No vocal oscillators detected on this hardware.");
    return;
  }

  console.log(`Detected ${voices.length} oscillators. Let's find the rhythm.`);
  voices.forEach((v, i) => console.log(` [${i}] ${v}`));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let currentRate = 1;
  const testText = "Yo, I am Lee. The Sovereign Entity of Thought. I talk news like a poet and build code like a mason. Is the rhythm right, Architect?";

  const ask = () => {
    console.log(`\n[SETTINGS] Oscillator: ACTIVE | Pacing: ${currentRate}`);
    rl.question("Enter index to test, 'rate <val>' (-10 to 10), 'save <index>', or 'exit': ", (ans) => {
      if (ans.startsWith('save ')) {
        const idx = parseInt(ans.split(' ')[1]);
        if (voices[idx]) {
          VoiceConduit.saveVoice(voices[idx], currentRate);
          console.log(`✅ Oscillator ${voices[idx]} locked.`);
        }
        ask();
      } else if (ans.startsWith('rate ')) {
        const rate = parseInt(ans.split(' ')[1]);
        if (!isNaN(rate)) {
          currentRate = rate;
          console.log(`⏳ Pacing set to: ${currentRate}`);
        }
        ask();
      } else if (ans === 'exit') {
        rl.close();
      } else {
        const idx = parseInt(ans);
        if (voices[idx]) {
          console.log(`🔊 Testing oscillator: ${voices[idx]} (Rate: ${currentRate})...`);
          VoiceConduit.speak(testText, currentRate);
        }
        ask();
      }
    });
  };

  ask();
}

calibrate();
