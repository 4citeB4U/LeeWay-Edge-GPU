/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.MAIN.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = main module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = src\main.tsx
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import React from 'react';
import { createRoot } from 'react-dom/client';
import LeeWayUniverse from '../LeeWayUniverse';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <LeeWayUniverse />
    </React.StrictMode>
  );
}
