/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.STANDARDS
TAG: AI.AGENT.AUTHORITY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=shield

5WH:
WHAT = Authority agent — declares allowed actions, denied actions, and execution scope per file/module
WHY = Governance requires explicit declaration of what each file is permitted to do
WHO = Rapid Web Development
WHERE = src/agents/standards/authority-agent.js
WHEN = 2026
HOW = Reads LEEWAY headers and .leeway/authority.json to validate action permissions

AGENTS:
AUTHORITY
POLICY
AUDIT

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseHeader } from '../../core/header-parser.js';

const DEFAULT_AUTHORITY = {
  allowedActions: ['read', 'write', 'transform', 'export'],
  deniedActions: ['execute_shell', 'network_request', 'modify_secrets', 'delete_files'],
  executionScope: 'module',
};

/**
 * AuthorityAgent declares and validates what actions a file or module is permitted to perform.
 */
export class AuthorityAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.authorityConfig = null;
  }

  /**
   * Load the project-level authority configuration.
   */
  async loadConfig() {
    const configPath = join(this.rootDir, '.leeway', 'authority.json');
    try {
      const raw = await readFile(configPath, 'utf8');
      this.authorityConfig = JSON.parse(raw);
    } catch {
      this.authorityConfig = { default: DEFAULT_AUTHORITY };
    }
    return this.authorityConfig;
  }

  /**
   * Get the authority declaration for a file.
   *
   * @param {string} filePath
   * @returns {Promise<AuthorityDeclaration>}
   */
  async getFileAuthority(filePath) {
    if (!this.authorityConfig) await this.loadConfig();

    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    let content = '';
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return { file: filePath, status: 'error' };
    }

    const header = parseHeader(content);
    const region = header?.region?.split('.')?.[0] || 'UNKNOWN';

    const authority = this.authorityConfig[region]
      || this.authorityConfig['default']
      || DEFAULT_AUTHORITY;

    return {
      file: filePath,
      region,
      agents: header?.agents || [],
      authority,
      status: 'resolved',
    };
  }

  /**
   * Check if a specific action is allowed for a file.
   *
   * @param {string} filePath
   * @param {string} action
   * @returns {Promise<boolean>}
   */
  async isActionAllowed(filePath, action) {
    const decl = await this.getFileAuthority(filePath);
    if (decl.status !== 'resolved') return false;

    const { allowedActions, deniedActions } = decl.authority;
    if (deniedActions.includes(action)) return false;
    return allowedActions.includes(action) || allowedActions.includes('*');
  }
}
