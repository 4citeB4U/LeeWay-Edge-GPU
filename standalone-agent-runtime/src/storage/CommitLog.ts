/*
LEEWAY HEADER — DO NOT REMOVE
REGION: STORAGE
TAG: CORE.COMMIT.LOG
5WH:
  WHAT = Execution audit logging system
  WHY = Persists state transitions for accountability and observability
  WHO = LeeWay Innovations
*/

import fs from "fs";
import path from "path";

export class CommitLog {
  private logPath: string;

  constructor() {
    this.logPath = path.join(process.cwd(), "logs", "execution.log");
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(data: any) {
    const entry = {
      ...data,
      timestamp: new Date().toISOString()
    };

    console.log(`💾 COMMIT_LOG: Archiving execution state...`);
    fs.appendFileSync(this.logPath, JSON.stringify(entry) + "\n");
  }
}
