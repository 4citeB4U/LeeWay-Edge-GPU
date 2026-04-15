/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CLI.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = cli module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = LeeWay-Standards\leeway-sdk\src\cli.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { auditFile, auditDirectory } from './audit.js';
import { fixFile, fixDirectory } from './fix.js';
import { generateMarkdownReport } from './report.js';

function printUsage() {
  console.log(`LEEWAY SDK CLI\n\nCommands:\n  scan <path>    Audit a file or directory and print summary.\n  fix <path>     Apply auto-fixes to a file or directory.\n  report <path>  Generate a Markdown compliance report.\n`);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  printUsage();
  process.exit(1);
}
const [command, target] = args;
const fullPath = path.resolve(process.cwd(), target);
if (!fs.existsSync(fullPath)) {
  console.error(`Error: path not found: ${fullPath}`);
  process.exit(1);
}

switch (command) {
  case 'scan': {
    const stats = fs.statSync(fullPath);
    const results = stats.isDirectory() ? auditDirectory(fullPath) : [auditFile(fullPath)];
    for (const res of results) {
      console.log(`${res.filePath}: Score ${res.complianceScore} (Grade ${res.grade})`);
      if (res.issues.length > 0) {
        console.log('  Issues:');
        for (const issue of res.issues) {
          console.log(`   - ${issue.description} ${issue.fixable ? '(auto-fixable)' : '(manual)'}`);
        }
      }
    }
    break;
  }
  case 'fix': {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      const issues = fixDirectory(fullPath);
      console.log(`Fixed ${issues.length} issue(s).`);
    } else {
      const result = fixFile(fullPath);
      if (result.issues.length > 0) {
        console.log(`Fixed ${result.issues.length} issue(s).`);
      } else {
        console.log('No fixes applied.');
      }
    }
    break;
  }
  case 'report': {
    const stats = fs.statSync(fullPath);
    const results = stats.isDirectory() ? auditDirectory(fullPath) : [auditFile(fullPath)];
    const md = generateMarkdownReport(results);
    console.log(md);
    break;
  }
  default:
    printUsage();
    process.exit(1);
}