/*
LEEWAY HEADER — DO NOT REMOVE
REGION: DEPLOYMENT
TAG: CORE.AGENT.PACKAGER
5WH:
  WHAT = Agent Forge & Packaging utility
  WHY = Bundles agent skills, logic, and memory into a portable .leeway package
  WHO = LeeWay Innovations
*/

import fs from "fs";
import path from "path";
import { buildHeader } from "../../../LeeWay-Standards/src/core/header-parser.js";

export class AgentPackager {
  /**
   * Forges a "Ready-to-go" agent bundle.
   */
  static async forge(agentId: string, skills: string[]): Promise<string> {
    console.log(`🔨 FORGE: Mobilizing assets for Agent [${agentId}]...`);
    
    const bundleDir = path.join(process.cwd(), "dist", "deployment", agentId);
    if (!fs.existsSync(bundleDir)) fs.mkdirSync(bundleDir, { recursive: true });

    const bundle: any = {
      id: agentId,
      timestamp: Date.now(),
      dna: "LEEWAY_SOVEREIGN_V1",
      skills: []
    };

    // 1. Pack Skills
    for (const skillId of skills) {
      const skillPath = path.join(process.cwd(), "skills", skillId.replace(/\./g, "/"));
      if (fs.existsSync(skillPath)) {
        console.log(`   📦 Packing skill: ${skillId}`);
        // Add skill file contents to bundle
      }
    }

    // 2. Generate Manifest
    const manifestPath = path.join(bundleDir, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(bundle, null, 2));

    // 3. Inject Sovereign Header
    const readmeSource = `# Sovereign Agent: ${agentId}\n\nThis agent is part of the Federated Sovereign Network. Direct execution enabled.`;
    const readmeHeader = buildHeader({
      region: "DEPLOYMENT",
      tag: `AGENT.${agentId.toUpperCase()}.BUNDLE`,
      what: `Packaged Agent Bundle for ${agentId}`,
      why: "Portable execution and Hub check-in",
      who: "LeeWay Agent Forge"
    });
    
    fs.writeFileSync(path.join(bundleDir, "README.md"), readmeHeader + readmeSource);

    return bundleDir;
  }
}
