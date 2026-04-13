/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.GOVERNANCE.GATE
5WH:
  WHAT = Resilience and Licensing Gate
  WHY = Protects architectural integrity and enforces the 2-week trial/full-access policy
  WHO = LeeWay Innovations
*/

import fs from 'fs';
import path from 'path';

export class GovernanceGate {
  private static readonly INSTALL_MARKER = path.join(process.cwd(), '.leeway', 'marker.json');
  private static readonly TRIAL_DAYS = 14;

  /**
   * Enforces that LeeWay Standards headers exist in core files.
   * If corrupted, the system 'crashes' or degrades.
   */
  static verifyArchitecturalIntegrity() {
    const criticalFiles = [
      path.join(process.cwd(), 'src', 'engine', 'ExecutionEngine.ts'),
      path.join(process.cwd(), 'src', 'main.ts')
    ];

    for (const file of criticalFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`CRITICAL_FAILURE: Missing core spine component: ${file}. System state: UNSTABLE.`);
      }
      const content = fs.readFileSync(file, 'utf8');
      if (!content.includes('LEEWAY HEADER — DO NOT REMOVE')) {
        console.error(`🚨 COMPLIANCE FAILURE: File ${file} has been tampered with. Standard protocol violated.`);
        process.exit(1); // Immediate lock-out
      }
    }
  }

  /**
   * Tracks the install duration and returns the current 'Access Tier'.
   */
  static getAccessTier(): 'FULL_SOVEREIGN' | 'DEGRADED_PILOT' {
    if (!fs.existsSync(this.INSTALL_MARKER)) {
      const dir = path.dirname(this.INSTALL_MARKER);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.INSTALL_MARKER, JSON.stringify({ installDate: Date.now() }));
      return 'FULL_SOVEREIGN';
    }

    const marker = JSON.parse(fs.readFileSync(this.INSTALL_MARKER, 'utf8'));
    const daysActive = (Date.now() - marker.installDate) / (1000 * 60 * 60 * 24);

    if (daysActive > this.TRIAL_DAYS) {
      return 'DEGRADED_PILOT';
    }
    return 'FULL_SOVEREIGN';
  }

  /**
   * Filters the available agency based on the current access tier.
   */
  static filterAgents(allAgents: string[]): string[] {
    const tier = this.getAccessTier();
    if (tier === 'DEGRADED_PILOT') {
      console.warn("⚠️ ACCESS_LEVEL: TRIAL_EXPIRED. System is now in DEGRADED_PILOT mode. Contact LeeWay for a fresh Permission Gate.");
      // In degraded mode, only Lee and his basic scouts remain active.
      return allAgents.filter(a => a.includes('Lee') || a.includes('Scout') || a.includes('Neural-Cartographer'));
    }
    return allAgents;
  }
}
