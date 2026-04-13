/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.LOCAL_VOICE_WORKER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = local-voice-worker module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\Web-Agents\local-voice-worker.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

// @ts-ignore
import { pipeline, env } from '@huggingface/transformers';

// Configure the environment for offline model loading.  See
// LocalVoiceLLM.ts for an explanation of these settings.  They must be
// duplicated here because each worker runs in its own execution
// context.
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.useBrowserCache = true;
env.remoteHost = '';
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

let generator: any = null;

self.onmessage = async (e) => {
  const { type, data } = e.data;
  if (type === 'load') {
    if (generator) {
      // Already loaded
      self.postMessage({ type: 'loaded' });
      return;
    }
    try {
      const { modelPath } = data;
      // Build the pipeline for text generation using the provided local path.
      generator = await pipeline('text-generation', modelPath, {
        // @ts-ignore
        dtype: 'q4',
        device: 'wasm',
        progress_callback: (progressData: any) => {
          if (progressData.status === 'progress') {
            // progressData.progress is between 0 and 1
            self.postMessage({ type: 'progress', data: Math.round(progressData.progress * 100) });
          }
        },
      });
      self.postMessage({ type: 'loaded' });
    } catch (error: any) {
      console.error('Local Voice LLM load error:', error);
      self.postMessage({ type: 'error', data: `LLM Load Failed: ${error.message}` });
    }
  } else if (type === 'generate') {
    if (!generator) {
      self.postMessage({ type: 'error', data: 'Model not loaded' });
      return;
    }
    const { prompt, systemInstruction } = data;
    // Use a simple chat template for instruction following.  We embed
    // system and user messages and instruct the model to produce an
    // assistant response.  Adjust this as needed for your model.
    const fullPrompt = `<|system|>\n${systemInstruction}<|end|>\n<|user|>\n${prompt}<|end|>\n<|assistant|>\n`;
    try {
      const output = await generator(fullPrompt, {
        max_new_tokens: 128,
        temperature: 0.6,
        do_sample: true,
        top_k: 40,
        repetition_penalty: 1.1,
        return_full_text: false,
      });
      let generatedText = output[0].generated_text.trim();
      // Strip any special tags from Phi templates if present
      generatedText = generatedText.split('<|end|>')[0].trim();
      generatedText = generatedText.split('<|user|>')[0].trim();
      generatedText = generatedText.split('<|system|>')[0].trim();
      self.postMessage({ type: 'generated', data: generatedText });
    } catch (error: any) {
      console.error('Local Voice LLM generate error:', error);
      self.postMessage({ type: 'error', data: error.message });
    }
  }
};