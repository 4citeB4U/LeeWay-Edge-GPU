/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.LOCALVISIONMODEL.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = LocalVisionModel module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\Web-Agents\LocalVisionModel.ts
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
 * LocalVisionModel.ts
 *
 * This module exposes a lightweight wrapper around a small object detection
 * model designed to run completely offline on mobile devices and single‑board
 * computers such as the Raspberry Pi.  It leverages the onnxruntime‑web
 * package to load and execute a pre‑trained YOLOv8n model compiled to
 * ONNX.  The YOLOv8n variant is particularly well suited for edge
 * applications: it contains just 3.15 million parameters and requires
 * roughly 6.83 GFLOPS to process an image, offering the fastest
 * inference speed among the models compared in a 2026 benchmark【879618065796737†L124-L134】.
 *
 * To use this module you must provide an ONNX file for the YOLOv8n model.
 * Visit the Ultralytics repository and export the model to ONNX using
 * `yolo export model=yolov8n.pt format=onnx`.  For mobile deployment
 * consider quantising the network to int8 or fp16 to reduce the file
 * size further.  Copy the resulting `.onnx` file into your public
 * directory (e.g. `public/models/yolov8n-int8.onnx`) and pass its
 * relative URL into `LocalVisionModel.load()`.
 *
 * Note: The onnxruntime‑web package is not included in this project by
 * default.  Install it via `npm install onnxruntime-web` (or
 * `pnpm add onnxruntime-web`) and ensure your bundler can handle
 * WebAssembly modules.  The API used here should work in modern
 * browsers and on devices that support WebAssembly.
 */

// We defer importing onnxruntime until runtime.  This avoids pulling
// the heavy wasm binary into the initial bundle.  Consumers should
// install `onnxruntime-web` as a dependency.
type InferenceSession = any;
type Tensor = any;

/**
 * A bounding box with confidence and class id.  Coordinates are given
 * relative to the original image dimensions (i.e. values range from 0 to
 * image width/height).
 */
export interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  classId: number;
}

export class LocalVisionModel {
  private session: InferenceSession | null = null;
  private inputShape: [number, number] = [640, 640];

  /**
   * Loads the ONNX model from the given URL.  The URL should be
   * relative to your web root (for example
   * `/models/yolov8n-int8.onnx`).  This method must be called before
   * invoking `detect()`.
   */
  async load(modelUrl: string): Promise<void> {
    if (this.session) return;
    // @ts-ignore
    const ort = await import('onnxruntime-web');
    // Use the WebAssembly backend with optimisations enabled.  The
    // `executionProviders` option can be extended to `['webgpu']` when
    // onnxruntime-web adds WebGPU support.
    this.session = await ort.InferenceSession.create(
      modelUrl,
      { executionProviders: ['wasm'], graphOptimizationLevel: 'all' }
    );
  }

  /**
   * Performs object detection on the provided image.  Accepts either
   * an HTMLImageElement, HTMLCanvasElement or ImageBitmap.  This
   * function resizes the input to the model's expected size, normalises
   * pixel values to the [0,1] range and constructs a tensor with shape
   * [1,3,H,W].  The function returns a list of detections sorted by
   * descending confidence.  Bounding box decoding is currently
   * simplified; it assumes the model outputs bounding box centres and
   * sizes directly without anchor boxes.  You may need to adapt the
   * postprocessing depending on the YOLO export you use.
   */
  async detect(
    image: HTMLImageElement | HTMLCanvasElement | ImageBitmap
  ): Promise<Detection[]> {
    if (!this.session) throw new Error('Model not loaded');
    // @ts-ignore
    const ort = await import('onnxruntime-web');
    // Create an offscreen canvas to resize and extract pixel data
    const [targetW, targetH] = this.inputShape;
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0, targetW, targetH);
    const imageData = ctx.getImageData(0, 0, targetW, targetH);
    // Convert to float32 and normalise
    const { data } = imageData;
    const floatData = new Float32Array(targetW * targetH * 3);
    for (let i = 0; i < targetW * targetH; i++) {
      floatData[i] = data[i * 4] / 255; // R
      floatData[i + targetW * targetH] = data[i * 4 + 1] / 255; // G
      floatData[i + targetW * targetH * 2] = data[i * 4 + 2] / 255; // B
    }
    const tensor: Tensor = new ort.Tensor('float32', floatData, [1, 3, targetH, targetW]);
    const feeds: { [name: string]: Tensor } = {};
    const inputName = this.session!.inputNames[0];
    feeds[inputName] = tensor;
    const results = await this.session!.run(feeds);
    // The output may contain multiple tensors; assume the first output
    // contains the detections with shape [1, N, classes + 5] where the
    // last dimension holds [cx, cy, w, h, conf, cls0, cls1, ...].
    const outputName = this.session!.outputNames[0];
    const output = results[outputName] as Tensor;
    const [batch, numBoxes, features] = output.dims;
    const dataArr = output.data as Float32Array;
    const detections: Detection[] = [];
    // Iterate through boxes and extract bounding boxes above a
    // confidence threshold.
    const confThreshold = 0.4;
    const numClasses = features - 5;
    for (let i = 0; i < numBoxes; i++) {
      const offset = i * features;
      const cx = dataArr[offset];
      const cy = dataArr[offset + 1];
      const w = dataArr[offset + 2];
      const h = dataArr[offset + 3];
      const conf = dataArr[offset + 4];
      // Determine the best class id and score
      let maxCls = -1;
      let maxScore = 0;
      for (let c = 0; c < numClasses; c++) {
        const score = dataArr[offset + 5 + c];
        if (score > maxScore) {
          maxScore = score;
          maxCls = c;
        }
      }
      const confidence = conf * maxScore;
      if (confidence > confThreshold) {
        // Convert from centre‑width‑height to top‑left coordinates and
        // scale back to the original image size.  The incoming image
        // might not be square, so compute scale factors.
        const origW = (image as any).naturalWidth || (image as any).width;
        const origH = (image as any).naturalHeight || (image as any).height;
        const scaleX = origW / targetW;
        const scaleY = origH / targetH;
        const x = (cx - w / 2) * scaleX;
        const y = (cy - h / 2) * scaleY;
        detections.push({
          x,
          y,
          width: w * scaleX,
          height: h * scaleY,
          confidence,
          classId: maxCls,
        });
      }
    }
    // Sort by confidence descending
    detections.sort((a, b) => b.confidence - a.confidence);
    return detections;
  }
}