/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.ALIGN_SKILLS_TO_AGENTS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = align-skills-to-agents module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = scripts\align-skills-to-agents.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import fs from 'fs/promises';
import path from 'path';

const rootDir = process.cwd();
const skillsDir = path.join(rootDir, 'agents', 'skills');

// Structural mapping: Which Sacred Agent Layer owns which Skill Category
const layerAlignmentMap = {
    'agent-autonomy': ['L3_Cognition: AdamCortex.ts', 'L3_Cognition: GabrielCortex.ts'],
    'agent-orchestration': ['L4_Consensus: MarshalVerify.ts', 'L2_Ingestion: RouterAgent.ts'],
    'agent-patterns': ['L8_Delivery: AgentLee.ts', 'L1_Perception: StreamingSTTAgent.ts'],
    'code-analysis': ['L6_Execution: SyntaxForge.ts'],
    'code-generation': ['L6_Execution: LiveConductorAgent.ts', 'L6_Execution: code_scout_agent.py'],
    'data-analysis': ['L3_Cognition: LilyCortex.ts', 'L7_Memory: Sage.ts'],
    'database-design': ['L7_Memory: ClerkArchive.ts', 'L7_Memory: indexer.py'],
    'debugging': ['L6_Execution: BugHunterForge.ts'],
    'devops': ['L2_Ingestion: Nexus.ts', 'L4_Consensus: GuardAegis.ts'],
    'documentation': ['L7_Memory: ScribeArchive.ts'],
    'error-handling': ['L5_Governance: Shield.ts', 'L5_Governance: JanitorSentinel.ts'],
    'git-workflow': ['L7_Memory: Archivist.py'],
    'infrastructure': ['L5_Governance: BrainSentinel.ts', 'L5_Governance: LeewayStandardsAgent.ts'],
    'observability': ['L5_Governance: sentinel_agent.py'],
    'operations': ['L8_Delivery: Agent.Logistic-Preparer.json'],
    'performance-optimization': ['L4_Consensus: Sovereign-Auditor'],
    'prompt-optimization': ['L3_Cognition: Agent.Phi-3.5-Orchestrator.json'],
    'quality-assurance': ['L4_Consensus: Sovereign-Auditor.json'],
    'rag-knowledge': ['L7_Memory: LibrarianAegis.ts'],
    'research': ['L3_Cognition: Atlas.ts', 'L3_Cognition: Nova.ts'],
    'security': ['L5_Governance: SafetyRedactionAgent.ts', 'L5_Governance: Shield.ts'],
    'self-optimization': ['L3_Cognition: Echo.ts'],
    'testing': ['L6_Execution: BugHunterForge.ts'],
    'tool-integration': ['L6_Execution: Azr-Coordinator', 'L2_Ingestion: Aria.ts'],
    'web-development': ['L8_Delivery: Pixel.ts', 'L8_Delivery: Agent.Interface-Designer.json'],
    'workflow-composition': ['L2_Ingestion: RouterAgent.ts']
};

const defaultAgents = ['L8_Delivery: AgentLee.ts (Prime Override)'];

async function scanAndAlign() {
    console.log("Starting Sacred Agent <-> Skill Alignment...");
    let alignedCount = 0;

    const categories = await fs.readdir(skillsDir, { withFileTypes: true });

    for (const category of categories) {
        if (!category.isDirectory()) continue;

        const categoryName = category.name;
        const ownedBy = layerAlignmentMap[categoryName] || defaultAgents;
        const ownershipString = ownedBy.join(', ');

        const categoryPath = path.join(skillsDir, categoryName);
        const skills = await fs.readdir(categoryPath, { withFileTypes: true });

        for (const skill of skills) {
            if (!skill.isDirectory()) continue;

            const skillPath = path.join(categoryPath, skill.name);
            const skillMdPath = path.join(skillPath, 'SKILL.md');

            try {
                // Check if SKILL.md exists
                const stats = await fs.stat(skillMdPath).catch(() => null);
                if (!stats) continue;

                let content = await fs.readFile(skillMdPath, 'utf8');

                // If it already has an ASSIGNED_SACRED_AGENTS tag, we skip or replace
                if (!content.includes('ASSIGNED_SACRED_AGENTS:')) {
                    // We append it right below the LICENSE block or at the bottom of the header
                    const injection = "ASSIGNED_SACRED_AGENTS:\n" + ownershipString + "\n\nLICENSE:";
                    content = content.replace(/LICENSE:/g, injection);
                    
                    // Add a structural alignment block at the very top of the markdown body
                    const mdInjection = "\n> **SOVEREIGN ALIGNMENT:** This skill is strictly executed by " + ownershipString + ". No unassigned Clones may natively execute this without Hive Mind routing.\n\n";
                    content = content.replace(/\*\/\n/, "*/\n" + mdInjection);

                    await fs.writeFile(skillMdPath, content, 'utf8');
                    console.log("[Aligned] " + categoryName + "/" + skill.name + " -> " + ownershipString);
                    alignedCount++;
                }

            } catch (err) {
                console.error("Failed to align " + skill.name + ": ", err.message);
            }
        }
    }

    console.log("\nAlignment complete. " + alignedCount + " skills have been structurally hard-locked to their Sacred Agents.");
}

scanAndAlign();
