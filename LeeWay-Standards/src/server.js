/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SERVER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = server module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = src\server.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import express from 'express';
import cors from 'cors';
import { AssessAgent } from './agents/governance/assess-agent.js';
import { AuditAgent } from './agents/governance/audit-agent.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/status', async (req, res) => {
  const agent = new AssessAgent({ rootDir: process.cwd() });
  const report = await agent.run();
  res.json({
    status: 'ACTIVE',
    agent: 'Lee',
    report
  });
});

app.get('/api/audit', async (req, res) => {
  const agent = new AuditAgent({ rootDir: process.cwd() });
  const report = await agent.run();
  res.json(report);
});

app.listen(port, () => {
  console.log(`\n🚀 LEEWAY Sovereign Backend active at http://localhost:${port}`);
  console.log(`[SYSTEM] Monitoring codebase: ${process.cwd()}\n`);
});
