/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: SECURITY.VALIDATOR.INTENTSANITIZER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IntentSanitizer module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = src\runtime\security\IntentSanitizer.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { Intent } from '../consensus/ExecutionTrace';

export class IntentSanitizer {
  /**
   * Cleanses the intent of potential prompt injections or overriding flags.
   */
  public static sanitize(rawIntent: any): Intent {
    if (!rawIntent || typeof rawIntent !== 'object') {
      throw new Error('Invalid intent format.');
    }

    // Force strict schema mapping
    const cleanIntent: Intent = {
      id: rawIntent.id || `INTENT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      action: String(rawIntent.action || 'UNKNOWN_ACTION').toUpperCase(),
      payload: {},
      timestamp: rawIntent.timestamp || Date.now()
    };

    // Strip out potential overrides in the payload
    if (rawIntent.payload && typeof rawIntent.payload === 'object') {
      for (const [key, value] of Object.entries(rawIntent.payload)) {
        // Prevent payload keys that try to manipulate system-level bypasses
        if (typeof key === 'string' && !key.toLowerCase().includes('bypass') && !key.toLowerCase().includes('override')) {
          cleanIntent.payload[key] = value;
        }
      }
    }

    return cleanIntent;
  }
}
