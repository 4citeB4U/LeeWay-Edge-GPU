/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.DOCUMENTATION.ARCHITECTURE
TAG: AI.ORCHESTRATION.DOCS.HIVE_MIND

5WH:
WHAT = Hive Mind Architecture Blueprint
WHY = To map the 8-layer ecosystem unifying Terminal, Web, and Edge RTC agents
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = LeeWay-Standards/Docs/06_Hive_Mind_Architecture.md
WHEN = 2026-04-11
HOW = Markdown specification defining Layers, Platforms, and Families across the Agentic OS

AGENTS:
ASSESS
AUDIT
ALIGN 

LICENSE:
MIT
*/

# The LeeWay Agentic Hive Mind: Unified Ecosystem Blueprint

This document specifies the global structure of the LeeWay Sovereign Hive Mind. True to the LeeWay constraints, this is an LLM-free (at the operational core), deterministically governed, 8-layer framework that unifies all agents across Terminal, Web, and Edge environments (including `LeeWay-Edge-RTC`).

## 1. The 8-Layer Operating Model
Every agent belongs precisely to one of these eight layers no matter where they execute.

1. **Layer 1: Perception (Sensory Bus)**
   *   **Role**: Captures raw events (Voice, Vision, Keyboard, Automation Triggers) and translates them into rigid `Intent` objects.
   *   **Agents**: VisionAgent, StreamingSTTAgent, hardware listeners.
2. **Layer 2: Cognition (Analysis & Assessment)**
   *   **Role**: Breaks down intents, parses syntax, and evaluates intent logic locally.
   *   **Agents**: CodeScout (Code Analysis), SyntaxForge.
3. **Layer 3: Consensus (The Hive Mind Voting)**
   *   **Role**: All specialized agents cryptographically "vote" or run validations before any action is approved.
   *   **Agents**: RouterAgent, MarshalVerify, AAAHelperAgents.
4. **Layer 4: Governance (Rules & Standards)**
   *   **Role**: Ensures zero deviation from the LeeWay methodology (5W+H headers, safety redaction).
   *   **Agents**: LeewayStandardsAgent, GuardAegis, SafetyRedactionAgent.
5. **Layer 5: Memory (State & History)**
   *   **Role**: Maintains Canonical, Session, and Archival histories.
   *   **Agents**: MemoryAgent, ClerkArchive, ScribeArchive, LibrarianAegis.
6. **Layer 6: Execution (Action & Mutation)**
   *   **Role**: Mutates the environment strictly from approved Intents (file writing, shell commands).
   *   **Agents**: DesktopCommanderAgent, PlaywrightAgent, BugHunterForge.
7. **Layer 7: Delivery (Synthesis & Output)**
   *   **Role**: Assembles the post-execution results into human/machine readable formats (Voice, UI updates).
   *   **Agents**: VoiceAgent, StreamingTTSAgent, LiveConductorAgent.
8. **Layer 8: Interface (Orchestration & Conduit)**
   *   **Role**: Agent Lee acts as the Sovereign Conduit (The singular user-facing orchestrator).
   *   **Agents**: AgentLee (Core), AgentLeeBT.

---

## 2. Platform Build Divisions (Deployment Targets)

All agents share the exact same logic and metadata, but they are bundled based on their interaction target. The LeeWay standards are enforced identically across all three.

### A. Terminal Build (Local Coder / CLI)
*   **Purpose**: Headless execution, deep file manipulation, and local repository management.
*   **Target Devices**: Developer Mac/PC.
*   **Key Agents**: DesktopCommander, SyntaxForge, LeewayStandardsAgent.

### B. Web Build (Voxel OS & React UI)
*   **Purpose**: Visual interactions, spatial/UI data representation, dashboarding.
*   **Target Devices**: Browser platforms, Desktop apps.
*   **Key Agents**: PlaywrightAgent, VisionAgent.

### C. Edge & RTC Build (Mobile, Pi, Wearables)
*   **Purpose**: Real-time voice, edge-vision, device hardware interaction, disconnected operations.
*   **Target**: `LeeWay-Edge-RTC-main` infrastructure, Android, Raspberry Pi, Apple.
*   **Key Agents**: HardwareGuardian, VoiceAgent, Sensory Processors.
*   *Integration Note*: The Edge RTC system acts as the universal sensory organ for the Hive Mind, feeding real-time sensory data directly into **Layer 1 (Perception)**.

---

## 3. The 7 Sovereign Families (Roles)

Agents are conceptually organized by their biological "Family" purpose to map out the civilization.

1. **The Conduit (Sovereigns)**
   *   *Agent Lee, RouterAgent, PlannerAgent* (Layer 8 / 3)
2. **The Scouts (Discovery & Analysis)**
   *   *CodeScout, VisionAgent, DocsRAGAgent* (Layer 1 / 2)
3. **The Healers (Standards & Alignment)**
   *   *LeewayStandardsAgent, SyntaxForge* (Layer 4)
4. **The Judges (Integrity & Validation)**
   *   *MarshalVerify, ValidationAgent* (Layer 3 / 4)
5. **The Guards (Security & Safety)**
   *   *GuardAegis, BrainSentinel, SafetyRedactionAgent* (Layer 4)
6. **The Chroniclers (Memory)**
   *   *MemoryAgent, ClerkArchive, ScribeArchive* (Layer 5)
7. **The Blacksmiths (Execution & Output)**
   *   *DesktopCommanderAgent, PlaywrightAgent, VoiceAgent* (Layer 6 / 7)

---

## 4. Unification Strategy & Next Steps

To make this Hive Mind a reality, we must execute the following structured plan:

**Phase 1: Global Standards Enforcement**
Run the `LeewayStandardsAgent` across both `LeeWay-Agents-the-World-Within` and `LeeWay-Edge-RTC-main` to ensure every agent file implements the `5WH` header and passes local governance checks.

**Phase 2: Registry Unification**
Update `agent-registry.json` (and build target-specific sub-registries) to strictly define the `layer`, `family`, and `build target` for every agent.

**Phase 3: RTC Sensory Bus Integration**
Wire the `LeeWay-Edge-RTC` application to the central Hive Mind Router so that mobile device inputs (eyes/ears) trigger formal `Intents` in the exact same format as terminal commands.

**Phase 4: Agent Decoupling (No LLM Reliance)**
Strip out any trailing general-purpose LLM logic in low-level agents. Force Vision Agents to only do localized visual comparison math or strict bounding boxes. Force Voice Agents into deterministic TTS streams. Leave LLMs strictly to "Agent Lee" orchestrator summarization.
