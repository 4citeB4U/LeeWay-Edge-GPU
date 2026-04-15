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
WHERE = LeeWay-Standards\leeway-sdk\src\fix.ts
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
import { Issue, inferTag, mapTagToRegion, generateDiscoveryPipeline } from './utils.js';

interface FixResult {
  filePath: string;
  fixedContent: string;
  issues: Issue[];
}

/**
 * Apply auto-fixes to a file. Generates missing header, TAG, REGION and DISCOVERY_PIPELINE.
 * Returns the fixed content along with the list of issues addressed.
 */
export function fixFile(filePath: string): FixResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const headerLines: string[] = [];
  let tagLine: string | undefined;
  let regionLine: string | undefined;
  let pipelineLine: string | undefined;
  let hasHeader = false;
  // Inspect first 20 lines for existing header
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i].trim();
    if (/LEEW?AY/i.test(line)) {
      hasHeader = true;
    }
    if (/TAG:/i.test(line)) {
      tagLine = line;
    }
    if (/REGION:/i.test(line)) {
      regionLine = line;
    }
    if (/DISCOVERY_PIPELINE:/i.test(line)) {
      pipelineLine = line;
    }
  }
  const issues: Issue[] = [];
  // Determine tag
  const inferredTag = inferTag(filePath);
  const expectedRegion = mapTagToRegion(inferredTag);
  if (!hasHeader) {
    issues.push({ filePath, description: 'Added missing LEEWAY header.', fixable: true });
  }
  if (!tagLine) {
    issues.push({ filePath, description: 'Added missing TAG definition.', fixable: true });
  }
  if (!regionLine) {
    issues.push({ filePath, description: 'Added missing REGION definition.', fixable: true });
  }
  if (!pipelineLine) {
    issues.push({ filePath, description: 'Added missing DISCOVERY_PIPELINE definition.', fixable: true });
  }
  // Build header
  const newHeader: string[] = [];
  newHeader.push('/*');
  newHeader.push(' * LEEWAY STANDARD HEADER');
  newHeader.push(` * TAG: ${tagLine ? tagLine.split(':')[1].trim() : inferredTag}`);
  newHeader.push(` * REGION: ${regionLine ? regionLine.split(':')[1].trim() : expectedRegion}`);
  newHeader.push(` * DISCOVERY_PIPELINE: ${pipelineLine ? pipelineLine.split(':')[1].trim() : generateDiscoveryPipeline()}`);
  newHeader.push(' */');
  const existingBody = hasHeader ? lines.join('\n') : lines.join('\n');
  // Remove any existing header comment block if found (start with /* and contains LEEWAY)
  let body = existingBody;
  if (hasHeader) {
    // naive removal: find first occurrence of '*/' after 'LEEE' within first 20 lines
    const headerStart = existingBody.indexOf('/*');
    const headerEnd = existingBody.indexOf('*/', headerStart);
    if (headerStart >= 0 && headerEnd > headerStart) {
      body = existingBody.slice(headerEnd + 2).trimStart();
    }
  }
  const fixedContent = [...newHeader, '', body].join('\n');
  return { filePath, fixedContent, issues };
}

/**
 * Recursively apply fixes to a directory and write changes to disk.
 */
export function fixDirectory(dirPath: string): Issue[] {
  const issues: Issue[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      issues.push(...fixDirectory(fullPath));
    } else if (entry.isFile()) {
      if (/\.(js|ts|jsx|tsx|json|py|java|go|c|cpp|cs|rb|php|html|css|md)$/i.test(entry.name)) {
        const result = fixFile(fullPath);
        if (result.issues.length > 0) {
          fs.writeFileSync(fullPath, result.fixedContent, 'utf-8');
          issues.push(...result.issues);
        }
      }
    }
  }
  return issues;
}