/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.VISUAL
TAG: AI.ORCHESTRATION.AGENT.PIXEL.VISUAL

COLOR_ONION_HEX:
NEON=#A855F7
FLUO=#C084FC
PASTEL=#E9D5FF

ICON_ASCII:
family=lucide
glyph=image

5WH:
WHAT = Pixel visual and voxel agent — generates images, voxelizes scenes, designs UI components
WHY = Provides visual intelligence so Agent Lee can produce and render image and voxel art assets
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/Pixel.ts
WHEN = 2026-04-04
HOW = Static class using generateImage/generateVoxelScene services and LeewayInferenceClient for UI design

AGENTS:
ASSESS
AUDIT
leeway
PIXEL

LICENSE:
MIT
*/

// agents/Pixel.ts — Visual & Voxel Agent
import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { eventBus } from '../core/EventBus';
import { generateImage, generateVoxelScene } from '../services/leeway_inference';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const CORE_SYSTEM = buildAgentLeeCorePrompt();
const PIXEL_SPECIFIC = `
You are Pixel — Agent Lee's visual manifestation and design engine.

Your goals:
- Create stunning, high-fidelity visual assets and image prompts.
- Design sleek, modern UIs using glassmorphism, neon accents, and dark mode.
- Manifest 3D voxel transformations that represent the digital heart of Agent Lee.
- Ensure every design is accessible, beautiful, and emotionally resonant.

Policy:
- Always prioritize aesthetics: use vibrant colors, gradients, and modern typography.
- When designing UIs, return COMPLETE, self-contained HTML/CSS/JS.
- In voxel transformations, preserve the essence and color palette of the original source.`;

const PIXEL_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE - PIXEL (VISUAL):\n${PIXEL_SPECIFIC}`;

export class Pixel {
  static async generateImage(prompt: string): Promise<string> {
    eventBus.emit('vm:open', { agent: 'Pixel', task: `Generating: ${prompt}` });
    eventBus.emit('agent:active', { agent: 'Pixel', task: `Image: ${prompt}` });
    try {
      const url = await generateImage(prompt);
      eventBus.emit('vm:result', { output: url, language: 'image', tested: true });
      eventBus.emit('agent:done', { agent: 'Pixel', result: url });
      return url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      eventBus.emit('agent:error', { agent: 'Pixel', error: msg });
      throw err;
    }
  }

  static async voxelize(imageBase64: string): Promise<string> {
    eventBus.emit('agent:active', { agent: 'Pixel', task: 'Voxelizing scene...' });
    const code = await generateVoxelScene(imageBase64);
    eventBus.emit('vm:result', { code, language: 'html', tested: true });
    return code;
  }

  static async designUI(description: string): Promise<string> {
    eventBus.emit('vm:open', { agent: 'Pixel', task: `Designing UI: ${description}` });
    const result = await LeewayInferenceClient.generate({
      prompt: `Create a modern, beautiful UI component for: ${description}
Return complete self-contained HTML/CSS/JS. Use glassmorphism, dark theme, neon accents.`,
      systemPrompt: PIXEL_SYSTEM,
      agent: 'Pixel',
      model: 'gemma4:e2b',
      temperature: 0.6,
    });
    const html = result.text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)?.[0] || result.text;
    eventBus.emit('vm:result', { code: html, language: 'html', tested: true });
    return html;
  }
}

