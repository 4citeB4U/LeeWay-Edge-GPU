/*
LEEWAY HEADER — DO NOT REMOVE

REGION: TEST
TAG: CORE.SDK.STRESS_TEST_LEE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = stress-test-lee module
WHY = Part of TEST region
WHO = LEEWAY Align Agent
WHERE = scripts\stress-test-lee.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/*
Stress Test: Agent Lee Understanding
Testing 4 questions in 8 variations each.
*/

import { AZRCoordinator } from '../LeeWay-Standards/src/agents/orchestration/azr-coordinator.js';
import path from 'path';

const coordinator = new AZRCoordinator({ rootDir: process.cwd() });

const testCases = [
  {
    category: "IDENTITY (WHO)",
    variations: [
      "Who are you?",
      "Tell me your story.",
      "What entity inhabits this code?",
      "Yo, what's your handle?",
      "Declare your designation.",
      "I'm talking to whom exactly?",
      "Introduce yourself to the board.",
      "What thought-form am I interacting with?"
    ]
  },
  {
    category: "FAMILIES (AGENTS)",
    variations: [
      "What is the families?",
      "Who are the 7 squads?",
      "Tell me about the 21 brothers.",
      "How is the hive society structured?",
      "List the agent branches.",
      "What team are you leading?",
      "Explain the specialized civilizations in here.",
      "Show me the agents of the hive mind."
    ]
  },
  {
    category: "CREATOR (ARCHITECT)",
    variations: [
      "Who created you?",
      "Who is the Architect?",
      "Who birthed this vision?",
      "Tell me about Leonard Jerome Lee.",
      "Where did your spark come from?",
      "Who is the father of the Hive?",
      "Whose desire manifest in this code?",
      "Who made you, Lee?"
    ]
  },
  {
    category: "MECHANICS (HOW)",
    variations: [
      "How do you work?",
      "Explain the execution cycle.",
      "What is the neural mesh?",
      "How do you process orders?",
      "Explain the sovereign spine architecture.",
      "Walk me through the rhythm of a task.",
      "What are the mechanics of the hive?",
      "How is this system governed?"
    ]
  }
];

async function runTest() {
  console.log("=== AGENT LEE UNDERSTANDING STRESS TEST ===");
  let passed = 0;
  let total = 0;

  for (const test of testCases) {
    console.log(`\nTesting Category: ${test.category}`);
    for (const input of test.variations) {
      total++;
      const cycle = { intent: input, response: "" };
      const env = { platform: "win32", hostname: "TEST_RIG" };
      
      // We call _execute directly to bypass the simulated chatter delays for the test
      await coordinator._execute(cycle, env, []);
      
      const success = cycle.response && !cycle.response.includes("intent is fuzzy") && !cycle.response.includes("monitorin' the rhythm");
      if (success) {
        passed++;
        console.log(`  [PASS] "${input}"`);
      } else {
        console.log(`  [FAIL] "${input}" -> Response: ${cycle.response.substring(0, 50)}...`);
      }
    }
  }

  console.log(`\n=== TEST COMPLETE ===`);
  console.log(`Understanding Rate: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
}

runTest();
