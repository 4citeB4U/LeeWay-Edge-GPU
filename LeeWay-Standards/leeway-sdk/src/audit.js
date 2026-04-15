/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AUDIT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = audit module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = LeeWay-Standards\leeway-sdk\src\audit.js
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
import { inferTag, mapTagToRegion } from './utils.js';

/**
 * Audit a single file for LEEWAY compliance.
 * Returns a result with issues and compliance score.
 */
function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const issues = [];
  // Search first 20 lines for header fields
  const headerLines = lines.slice(0, 20);
  let tagLine;
  let regionLine;
  let pipelineLine;
  let hasHeader = false;
  for (const line of headerLines) {
    const trimmed = line.trim();
    if (/LEEW?AY/i.test(trimmed)) {
      hasHeader = true;
    }
    if (/TAG:/i.test(trimmed)) {
      tagLine = trimmed;
    }
    if (/REGION:/i.test(trimmed)) {
      regionLine = trimmed;
    }
    if (/DISCOVERY_PIPELINE:/i.test(trimmed)) {
      pipelineLine = trimmed;
    }
  }
  if (!hasHeader) {
    issues.push({ filePath, description: 'Missing LEEWAY header.', fixable: true });
  }
  if (!tagLine) {
    issues.push({ filePath, description: 'Missing TAG definition.', fixable: true });
  } else {
    const tagValue = tagLine.split(':')[1] ? tagLine.split(':')[1].trim() : '';
    const parts = tagValue.split('.');
    if (parts.length !== 4) {
      issues.push({ filePath, description: `TAG "${tagValue}" is improperly formatted. Expected four segments.`, fixable: false });
    }
  }
  if (!regionLine) {
    issues.push({ filePath, description: 'Missing REGION definition.', fixable: true });
  } else {
    const regionValue = regionLine.split(':')[1] ? regionLine.split(':')[1].trim() : '';
    const tag = tagLine ? (tagLine.split(':')[1] ? tagLine.split(':')[1].trim() : '') : inferTag(filePath);
    const expectedRegion = mapTagToRegion(tag);
    if (regionValue !== expectedRegion) {
      issues.push({ filePath, description: `REGION "${regionValue}" does not match expected region "${expectedRegion}" for tag ${tag}.`, fixable: true });
    }
  }
  if (!pipelineLine) {
    issues.push({ filePath, description: 'Missing DISCOVERY_PIPELINE definition.', fixable: true });
  }
  let score = 100;
  for (const issue of issues) {
    score -= issue.fixable ? 5 : 10;
  }
  if (score < 0) score = 0;
  let grade;
  if (score >= 95) grade = 'GOLD';
  else if (score >= 80) grade = 'SILVER';
  else if (score >= 70) grade = 'BRONZE';
  else grade = 'NON-COMPLIANT';
  return { filePath, issues, complianceScore: score, grade };
}

function auditDirectory(dirPath) {
  const results = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...auditDirectory(fullPath));
    } else if (entry.isFile()) {
      if (/\.(js|ts|jsx|tsx|json|py|java|go|c|cpp|cs|rb|php|html|css|md)$/i.test(entry.name)) {
        results.push(auditFile(fullPath));
      }
    }
  }
  return results;
}

export { auditFile, auditDirectory };