/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.VISION_WORKER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = vision-worker module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\Web-Agents\vision-worker.ts
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
 * WebWorker for running object detection in a background thread.  This
 * worker loads the lightweight YOLOv8n model via onnxruntime‑web and
 * exposes `load` and `detect` commands.  Offloading inference to a
 * worker prevents heavy computation from blocking the main UI thread on
 * mobile devices.  See LocalVisionModel.ts for details on the
 * underlying model and decoding logic.
 */

import { LocalVisionModel } from './LocalVisionModel';

let visionModel: LocalVisionModel | null = null;

self.onmessage = async (e) => {
  const { type, data } = e.data;
  if (type === 'load') {
    try {
      if (!visionModel) visionModel = new LocalVisionModel();
      const { modelPath } = data;
      await visionModel.load(modelPath);
      self.postMessage({ type: 'loaded' });
    } catch (err: any) {
      self.postMessage({ type: 'error', data: err.message });
    }
  } else if (type === 'detect') {
    if (!visionModel) {
      self.postMessage({ type: 'error', data: 'Model not loaded' });
      return;
    }
    const { imageBitmap } = data;
    try {
      const detections = await visionModel.detect(imageBitmap);
      // Transfer detections back to the main thread.  The array
      // contains plain objects so it can be cloned.
      self.postMessage({ type: 'detections', data: detections });
    } catch (err: any) {
      self.postMessage({ type: 'error', data: err.message });
    }
  }
};