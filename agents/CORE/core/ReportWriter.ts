/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.REPORTING
TAG: CORE.REPORT_WRITER
5WH:
  WHAT = Standardized reporting utility
  WHY = Formats and persists agent activity into audit-ready logs
  WHO = LeeWay Innovations
*/

import fs from 'fs';
import path from 'path';

export class ReportWriter {
  private static readonly LOG_PATH = path.join(process.cwd(), 'logs', 'agent_activity.jsonl');

  static async write(report: any) {
    const dir = path.dirname(this.LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const entry = JSON.stringify(report) + '\n';
    fs.appendFileSync(this.LOG_PATH, entry);
  }
}
