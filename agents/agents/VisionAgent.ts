/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.VISIONAGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = VisionAgent module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\VisionAgent.ts
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
// VisionAgent class moved to cortices/visual/VisionAgent.ts
// Use dynamic import to load VisionAgent when needed.
      await VisionAgent.analyseImage(imageBase64);
    } catch (err) {
      eventBus.emit('agent:error', { agent: 'Vision', error: `RTC frame capture failed: ${String(err)}` });
    }
  }

  static async captureAndAnalyse(): Promise<void> {
    let imageBase64: string;
    try {
      imageBase64 = await VisionAgent._captureScreenBase64();
    } catch (err) {
      eventBus.emit('agent:error', { agent: 'Vision', error: `Screen capture failed: ${String(err)}` });
      return;
    }
    await VisionAgent.analyseImage(imageBase64);
  }

  /**
  * Analyse a caller-provided base64 PNG/JPEG image.
  * Emits vision:screen_text, vision:scene_summary, vision:ui_hints to EventBus.
  * 2026: Ollama vision model only (no fallback)
   */
  static async analyseImage(imageBase64: string, mimeType = 'image/png'): Promise<void> {
    eventBus.emit('agent:active', { agent: 'Vision', task: 'Analysing image' });
    try {
      // Use SLMRouter with the Ollama vision model only
      const prompt = `${VISION_SYSTEM}\n\nAnalyse this image encoded as base64 and respond with JSON.`;
      const result = await slmRouter.generate(prompt + `\n[IMAGE_BASE64]\n` + imageBase64, { maxTokens: 1024 }, 'vision');
      const parsed = JSON.parse(result.trim()) as {
        screen_text: string;
        scene_summary: string;
        ui_hints: string[];
      };
      eventBus.emit('vision:screen_text', { text: parsed.screen_text, confidence: 0.9 });
      eventBus.emit('vision:scene_summary', { summary: parsed.scene_summary });
      eventBus.emit('vision:ui_hints', { hints: parsed.ui_hints });
      eventBus.emit('agent:done', { agent: 'Vision', result: parsed.scene_summary });
    } catch (err) {
      eventBus.emit('agent:error', {
        agent: 'Vision',
        error: `Vision backend failed: Ollama-only (${err})`
      });
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private static async _captureScreenBase64(): Promise<string> {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    const IC = (window as unknown as { ImageCapture: new (t: MediaStreamTrack) => { grabFrame(): Promise<ImageBitmap> } }).ImageCapture;
    if (!IC) throw new Error('ImageCapture API not available in this browser.');
    const imageCapture = new IC(track);
    const bitmap = await imageCapture.grabFrame();
    track.stop();

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    // Strip the data:image/png;base64, prefix
    return canvas.toDataURL('image/png').split(',')[1];
  }
}
