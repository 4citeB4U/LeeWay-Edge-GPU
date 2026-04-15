/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: SECURITY.VALIDATOR.MODULELOADERAGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ModuleLoaderAgent module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = src\runtime\security\cortices\ModuleLoaderAgent.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import * as vm from 'vm';
import { GovernanceContract } from '../GovernanceContract';
import * as fs from 'fs/promises';

export class ModuleLoaderAgent {
  /**
   * Lazy-loads an external module into an isolated, sandbox-guarded environment.
   */
  public static async loadModule(moduleId: string, filePath: string, expectedSignature: string): Promise<any> {
    console.log(`[ModuleLoaderAgent] Attempting to load module from ${filePath}`);
    
    // 1. Read the source code
    let sourceCode: string;
    try {
      sourceCode = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
       throw new Error(`Failed to read module file at ${filePath}.`);
    }

    // 2. Pass through the Governance Contract
    GovernanceContract.verifyModuleSignature(moduleId, sourceCode, expectedSignature);

    // 3. Create isolated sandbox environment
    const sandboxContext = {
      module: { exports: {} },
      exports: {},
      console: {
        log: (...args: any[]) => console.log(`[Sandbox ${moduleId}]`, ...args),
        error: (...args: any[]) => console.error(`[Sandbox ${moduleId}]`, ...args)
      },
      Buffer, // Allow basic operations if needed, but restrict fs/child_process
    };
    
    vm.createContext(sandboxContext);

    // 4. Execute script within the sandbox
    try {
      const script = new vm.Script(sourceCode);
      script.runInContext(sandboxContext, { timeout: 1000 }); // Prevent infinite loops
      
      console.log(`[ModuleLoaderAgent] Moduled loaded and sandboxed successfully: ${moduleId}`);
      return sandboxContext.module.exports;
    } catch (error) {
      console.error(`[ModuleLoaderAgent] Sandbox execution failed for module ${moduleId}.`);
      throw error;
    }
  }
}
