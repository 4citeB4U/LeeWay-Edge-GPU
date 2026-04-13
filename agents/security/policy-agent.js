/*
LEEWAY HEADER — DO NOT REMOVE

REGION: SECURITY.AGENT.POLICY
TAG: SECURITY.POLICY.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=scroll

5WH:
WHAT = Policy agent — enforces LEEWAY policy bundles across the codebase
WHY = Governance requires consistent enforcement of named policy sets
WHO = Rapid Web Development
WHERE = src/agents/security/policy-agent.js
WHEN = 2026
HOW = Loads policy bundles from .leeway/policies.json, evaluates against file metadata

AGENTS:
POLICY
AUDIT
PERMISSION

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEFAULT_POLICIES = {
  NO_SECRETS_IN_CODE: { description: 'No hardcoded secrets or credentials', enforced: true },
  HEADERS_REQUIRED: { description: 'All code files must have LEEWAY headers', enforced: true },
  TAGS_REQUIRED: { description: 'All code files must have valid TAGs', enforced: true },
  NO_CIRCULAR_DEPS: { description: 'No circular module dependencies', enforced: true },
  NAMING_CONVENTIONS: { description: 'Files must follow naming conventions', enforced: false },
  PLACEMENT_RULES: { description: 'Files must be in correct directories', enforced: false },
};

/**
 * PolicyAgent enforces named LEEWAY policy bundles.
 */
export class PolicyAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.policies = { ...DEFAULT_POLICIES };
  }

  /**
   * Load policies from .leeway/policies.json (merges with defaults).
   */
  async loadPolicies() {
    const policyPath = join(this.rootDir, '.leeway', 'policies.json');
    try {
      const raw = await readFile(policyPath, 'utf8');
      const loaded = JSON.parse(raw);
      this.policies = { ...DEFAULT_POLICIES, ...loaded };
    } catch {
      // Use defaults
    }
    return this.policies;
  }

  /**
   * Get all currently active (enforced) policies.
   * @returns {string[]}
   */
  getActivePolicies() {
    return Object.entries(this.policies)
      .filter(([, p]) => p.enforced)
      .map(([name]) => name);
  }

  /**
   * Check if a specific policy is active.
   *
   * @param {string} policyName
   * @returns {boolean}
   */
  isPolicyActive(policyName) {
    return this.policies[policyName]?.enforced === true;
  }

  /**
   * List all policies with their enforcement status.
   * @returns {object}
   */
  listPolicies() {
    return Object.entries(this.policies).map(([name, data]) => ({
      name,
      description: data.description,
      enforced: data.enforced,
    }));
  }
}
