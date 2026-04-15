/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.FIX.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = fix module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = LeeWay-Standards\leeway-sdk\src\fix.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import fs from 'fs';
import path from 'path';
import { inferTag, mapTagToRegion, generateDiscoveryPipeline } from './utils.js';

/**
 * Apply auto-fixes to a single file: add header, TAG, REGION, and DISCOVERY_PIPELINE.
 * Writes changes back to disk.
 */
function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  let tagLine;
  let regionLine;
  let pipelineLine;
  let hasHeader = false;
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i].trim();
    if (/LEEW?AY/i.test(line)) {
      hasHeader = true;
    }
    if (/TAG:/i.test(line)) tagLine = line;
    if (/REGION:/i.test(line)) regionLine = line;
    if (/DISCOVERY_PIPELINE:/i.test(line)) pipelineLine = line;
  }
  const issues = [];
  const inferredTag = inferTag(filePath);
  const expectedRegion = mapTagToRegion(inferredTag);
  if (!hasHeader) issues.push({ filePath, description: 'Added missing LEEWAY header.', fixable: true });
  if (!tagLine) issues.push({ filePath, description: 'Added missing TAG definition.', fixable: true });
  if (!regionLine) issues.push({ filePath, description: 'Added missing REGION definition.', fixable: true });
  if (!pipelineLine) issues.push({ filePath, description: 'Added missing DISCOVERY_PIPELINE definition.', fixable: true });
  // Build new header lines
  const newHeader = [];
  newHeader.push('/*');
  newHeader.push(' * LEEWAY STANDARD HEADER');
  newHeader.push(` * TAG: ${tagLine ? tagLine.split(':')[1].trim() : inferredTag}`);
  newHeader.push(` * REGION: ${regionLine ? regionLine.split(':')[1].trim() : expectedRegion}`);
  newHeader.push(` * DISCOVERY_PIPELINE: ${pipelineLine ? pipelineLine.split(':')[1].trim() : generateDiscoveryPipeline()}`);
  newHeader.push(' */');
  // Remove existing header if present
  let body = content;
  if (hasHeader) {
    const headerStart = content.indexOf('/*');
    const headerEnd = content.indexOf('*/', headerStart);
    if (headerStart >= 0 && headerEnd > headerStart) {
      body = content.slice(headerEnd + 2).trimStart();
    }
  }
  const fixedContent = [...newHeader, '', body].join('\n');
  fs.writeFileSync(filePath, fixedContent, 'utf-8');
  return { filePath, issues };
}

function fixDirectory(dirPath) {
  const allIssues = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      allIssues.push(...fixDirectory(fullPath));
    } else if (entry.isFile()) {
      if (/\.(js|ts|jsx|tsx|json|py|java|go|c|cpp|cs|rb|php|html|css|md)$/i.test(entry.name)) {
        const res = fixFile(fullPath);
        allIssues.push(...res.issues);
      }
    }
  }
  return allIssues;
}

export { fixFile, fixDirectory };