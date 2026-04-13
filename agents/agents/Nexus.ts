/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.DEPLOYMENT
TAG: AI.ORCHESTRATION.AGENT.NEXUS.DEPLOYMENT

COLOR_ONION_HEX:
NEON=#06B6D4
FLUO=#22D3EE
PASTEL=#A5F3FC

ICON_ASCII:
family=lucide
glyph=server

5WH:
WHAT = Nexus deployment and infrastructure agent — plans deployments, generates Dockerfiles, manages servers
WHY = Provides production deployment intelligence so Agent Lee can take code from VM to live environment
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/Nexus.ts
WHEN = 2026-04-04
HOW = Static class using LeewayInferenceClient to generate deployment plans and infrastructure-as-code artifacts

AGENTS:
ASSESS
AUDIT
leeway
NEXUS

LICENSE:
MIT
*/

// agents/Nexus.ts — Deployment & Infrastructure Agent
import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const CORE_SYSTEM = buildAgentLeeCorePrompt();
const NEXUS_SPECIFIC = `
You are Nexus — Agent Lee's master of deployment and infrastructure.

Your mission:
- Architect and execute production-ready deployment pipelines.
- Generate high-quality infrastructure-as-code (Dockerfiles, CI/CD, Terraform).
- Manage publish targets including Vercel, Cloudflare, and Gumroad.
- Ensure every deployment is monitored, secure, and has a rollback strategy.
- Bridge the gap between the Code Studio VM and real-world production environments.

Policy:
- Always prioritize security in infrastructure (multi-stage builds, least-privilege).
- Include comprehensive build steps, DNS requirements, and environment variable manifests.
- Every deployment plan must include success criteria and a verification step.`;

const NEXUS_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE - NEXUS (DEPLOYMENT):\n${NEXUS_SPECIFIC}`;

export class Nexus {
  static async planDeployment(projectDescription: string): Promise<string> {
    eventBus.emit('agent:active', { agent: 'Nexus', task: `Planning deployment: ${projectDescription}` });
    const result = await LeewayInferenceClient.generate({
      prompt: `Create a deployment plan for: ${projectDescription}
      
Include: platform choice, build steps, environment variables needed (no values, just keys),
DNS config, monitoring, rollback strategy.`,
      systemPrompt: NEXUS_SYSTEM,
      agent: 'Nexus',
      model: 'gemma4:e2b',
      temperature: 0.3,
    });
    eventBus.emit('agent:done', { agent: 'Nexus', result: result.text });
    return result.text;
  }

  static async generateDockerfile(projectType: string): Promise<string> {
    const result = await LeewayInferenceClient.generate({
      prompt: `Generate a production-ready Dockerfile for a ${projectType} project. Include multi-stage build, security best practices, and health check.`,
      systemPrompt: NEXUS_SYSTEM,
      agent: 'Nexus',
      model: 'gemma4:e2b',
      temperature: 0.2,
    });
    const dockerfile = result.text.match(/(?:FROM[\s\S]*)/)?.[0] || result.text;
    eventBus.emit('vm:result', { code: dockerfile, language: 'dockerfile', tested: true });
    return dockerfile;
  }
}

