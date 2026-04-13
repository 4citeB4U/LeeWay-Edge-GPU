/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.VISIONASSISTANT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = VisionAssistant module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\Web-Agents\VisionAssistant.tsx
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import React, { useEffect, useRef, useState } from 'react';

/**
 * VisionAssistant
 *
 * This React component provides a simple object awareness UI for
 * mobile devices.  It opens the device camera, streams frames to a
 * dedicated WebWorker that runs a local YOLOv8n model, and
 * overlays detected bounding boxes on top of the video.  The
 * component accepts a `modelPath` prop specifying the path to the
 * ONNX file relative to the application root.
 */
export const VisionAssistant: React.FC<{ modelPath: string }> = ({ modelPath }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise camera on mount
  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        setError('Unable to access camera: ' + err.message);
      }
    })();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Initialise worker and load model
  useEffect(() => {
    const worker = new Worker(new URL('./vision-worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === 'loaded') setLoaded(true);
      if (type === 'error') setError(data);
      if (type === 'detections') {
        drawDetections(data as any[]);
      }
    };
    worker.postMessage({ type: 'load', data: { modelPath } });
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [modelPath]);

  // Capture frames and send to worker
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    const capture = async () => {
      if (!videoRef.current || !workerRef.current) return;
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const bitmap = await createImageBitmap(canvas);
      workerRef.current.postMessage({ type: 'detect', data: { imageBitmap: bitmap } }, [bitmap]);
    };
    const interval = setInterval(() => {
      if (!cancelled) capture();
    }, 500); // capture at 2 FPS to conserve battery
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loaded]);

  const drawDetections = (detections: { x: number; y: number; width: number; height: number; confidence: number; classId: number }[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'red';
    detections.forEach((det) => {
      ctx.beginPath();
      ctx.rect(det.x, det.y, det.width, det.height);
      ctx.stroke();
      const label = `${det.classId} ${(det.confidence * 100).toFixed(1)}%`;
      ctx.fillText(label, det.x, det.y - 2);
    });
  };

  return (
    <div className="w-full h-full relative bg-black">
      {error && <div className="absolute top-0 left-0 right-0 p-2 bg-red-500 text-white z-10">{error}</div>}
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
      {!loaded && !error && <div className="absolute inset-0 flex items-center justify-center text-white">Loading vision model…</div>}
    </div>
  );
};