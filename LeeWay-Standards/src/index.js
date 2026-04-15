/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.SDK.ENTRY
TAG: CORE.SDK.LEEWAY.INDEX

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=layers

5WH:
WHAT = LEEWAY SDK main entry point — exports all agents, core modules, and utilities
WHY = Provides a single importable surface for consumers of the LEEWAY governance framework
WHO = Rapid Web Development
WHERE = src/index.js
WHEN = 2026
HOW = ESM exports, lazy agent loading, zero heavy dependencies

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

export { parseHeader, buildHeader, validateHeader } from './core/header-parser.js';
export { validateTag, inferTag } from './core/tag-validator.js';
export { classifyRegion, REGIONS } from './core/region-classifier.js';
export { scoreCompliance, COMPLIANCE_LEVELS } from './core/compliance-scorer.js';

export { AssessAgent } from './agents/governance/assess-agent.js';
export { AlignAgent } from './agents/governance/align-agent.js';
export { AuditAgent } from './agents/governance/audit-agent.js';

export { HeaderAgent } from './agents/standards/header-agent.js';
export { TagAgent } from './agents/standards/tag-agent.js';
export { RegionAgent } from './agents/standards/region-agent.js';
export { DiscoveryPipelineAgent } from './agents/standards/discovery-pipeline-agent.js';
export { AuthorityAgent } from './agents/standards/authority-agent.js';
export { PlacementAgent } from './agents/standards/placement-agent.js';
export { RegistryAgent } from './agents/standards/registry-agent.js';

export { EndpointAgent } from './agents/mcp/endpoint-agent.js';
export { TransportAgent } from './agents/mcp/transport-agent.js';
export { PortAgent } from './agents/mcp/port-agent.js';
export { ProcessAgent } from './agents/mcp/process-agent.js';
export { EnvAgent } from './agents/mcp/env-agent.js';
export { RuntimeAgent } from './agents/mcp/runtime-agent.js';
export { ManifestAgent } from './agents/mcp/manifest-agent.js';
export { HealthAgentLite } from './agents/mcp/health-agent-lite.js';

export { SyntaxAgent } from './agents/integrity/syntax-agent.js';
export { ImportAgent } from './agents/integrity/import-agent.js';
export { ModulePolicyAgent } from './agents/integrity/module-policy-agent.js';
export { DuplicateLogicAgent } from './agents/integrity/duplicate-logic-agent.js';
export { DependencyGraphAgent } from './agents/integrity/dependency-graph-agent.js';
export { CircularDependencyAgent } from './agents/integrity/circular-dependency-agent.js';
export { RefactorScanAgent } from './agents/integrity/refactor-scan-agent.js';

export { SecretScanAgent } from './agents/security/secret-scan-agent.js';
export { PermissionAgent } from './agents/security/permission-agent.js';
export { PromptSecurityAgent } from './agents/security/prompt-security-agent.js';
export { ToolAccessAgent } from './agents/security/tool-access-agent.js';
export { PolicyAgent } from './agents/security/policy-agent.js';
export { PrivacyAgent } from './agents/security/privacy-agent.js';

export { SchemaAgent } from './agents/discovery/schema-agent.js';
export { SitemapAgent } from './agents/discovery/sitemap-agent.js';
export { IntentRegistryAgent } from './agents/discovery/intent-registry-agent.js';
export { DocsAgent } from './agents/discovery/docs-agent.js';
export { ExplainAgent } from './agents/discovery/explain-agent.js';
export { ArchitectureMapAgent } from './agents/discovery/architecture-map-agent.js';

export { RouterAgent } from './agents/orchestration/router-agent.js';
export { MemoryAgentLite } from './agents/orchestration/memory-agent-lite.js';
export { DoctorAgent } from './agents/orchestration/doctor-agent.js';
