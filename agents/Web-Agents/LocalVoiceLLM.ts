/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.LOCALVOICELLM.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = LocalVoiceLLM module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\Web-Agents\LocalVoiceLLM.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * This module provides a lightweight, offline‑first language model runner for
 * mobile devices and embedded hardware such as Raspberry Pi.  It wraps the
 * huggingface/transformers pipeline to load a quantised on‑device model and
 * exposes a simple `load` and `generate` API.  To operate completely offline
 * you must download a supported model ahead of time and place it in the
 * `public/models/` directory of your project.  Set `DEFAULT_MODEL_PATH` below
 * to the relative path of the model you wish to use.
 */

// @ts-ignore
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers for offline operation.  By enabling
// `allowLocalModels` and setting the `remoteHost` to an empty string we
// prevent the library from attempting network downloads.  Instead it will
// look for model files in the browser cache or relative URLs.
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.useBrowserCache = true;
env.remoteHost = '';
// Force WASM execution; we disable threading to reduce memory usage on mobile.
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

// Default path to the local model.  Replace this with the path to the model
// files you bundle in your application.  For example, if you download the
// quantised phi‑3 mini model from Hugging Face and place it in
// `public/models/phi-3-mini-int4`, then set this constant to that string.
const DEFAULT_MODEL_PATH = '/models/phi-3-mini-int4';

/**
 * LocalVoiceLLM encapsulates a lightweight language model that runs
 * completely client‑side in a Web Worker.  It exposes asynchronous
 * `load()` and `generate()` methods similar to those used by the
 * `LocalLLM` in the original Urban Voice AI project but tuned for
 * offline operation.  The model is instantiated using the
 * `@huggingface/transformers` pipeline API.
 */
export class LocalVoiceLLM {
  private worker: Worker | null = null;
  private onProgress: ((progress: number) => void) | null = null;
  private onLoaded: (() => void) | null = null;
  private onGenerated: ((text: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (this.worker) return;
    // Lazy import of the worker script.  The worker itself will load
    // the model and perform generation.  We use a separate file to
    // allow bundlers to split the code and to avoid blocking the main thread.
    this.worker = new Worker(new URL('./local-voice-worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === 'progress') this.onProgress?.(data);
      if (type === 'loaded') this.onLoaded?.();
      if (type === 'generated') this.onGenerated?.(data);
      if (type === 'error') this.onError?.(data);
    };
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
  }

  /**
   * Load the model into memory.  You must call this before generating
   * responses.  The `onProgress` callback receives a number between 0
   * and 100 indicating the download/progress percentage.  When the
   * promise resolves the model is ready for inference.
   */
  async load(onProgress: (progress: number) => void): Promise<void> {
    this.initWorker();
    this.onProgress = onProgress;
    return new Promise((resolve, reject) => {
      this.onLoaded = () => resolve();
      this.onError = (err) => reject(new Error(err));
      this.worker?.postMessage({ type: 'load', data: { modelPath: DEFAULT_MODEL_PATH } });
    });
  }

  /**
   * Generate a text completion given a user prompt and system instruction.
   * Returns the assistant's response as a string.  If generation fails
   * the returned promise will reject with an error.
   */
  async generate(prompt: string, systemInstruction: string): Promise<string> {
    this.initWorker();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.onError = null;
        this.onGenerated = null;
        reject(new Error('AI generation timed out (60s). Your device might be under heavy load.'));
      }, 60000);
      this.onGenerated = (text) => {
        clearTimeout(timeout);
        resolve(text);
      };
      this.onError = (err) => {
        clearTimeout(timeout);
        reject(new Error(err));
      };
      this.worker?.postMessage({ type: 'generate', data: { prompt, systemInstruction } });
    });
  }
}