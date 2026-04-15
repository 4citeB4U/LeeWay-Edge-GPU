/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: SECURITY.VALIDATOR.GOVERNANCECONTRACT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = GovernanceContract module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = src\runtime\security\GovernanceContract.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import * as crypto from 'crypto';

export class GovernanceContract {
  /**
   * Verifies the SHA-256 signature of a code module against an expected signature.
   * Throws an error if the signature does not match.
   */
  public static verifyModuleSignature(moduleId: string, sourceCode: string, expectedSignature: string): boolean {
    const hash = crypto.createHash('sha256').update(sourceCode).digest('hex');

    if (hash !== expectedSignature) {
      console.error(`[GovernanceContract] Signature Mismatch for module ${moduleId}. Expected ${expectedSignature}, got ${hash}.`);
      throw new Error(`SECURITY EXCEPTION: Module ${moduleId} failed Governance Contract signature validation. Execution blocked.`);
    }

    console.log(`[GovernanceContract] Module ${moduleId} verified successfully.`);
    return true;
  }
}
