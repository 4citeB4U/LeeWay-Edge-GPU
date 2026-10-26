/* LeeWay challenge: bind the existing AuditAgent to staged artifacts only. */
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 4 || new Set([args[0], args[2]]).size !== 2 || !['--evidence', '--audit-agent'].includes(args[0]) || !['--evidence', '--audit-agent'].includes(args[2])) {
    throw new Error('Usage: node audit-nvidia-challenge.mjs --evidence DIRECTORY --audit-agent FILE');
  }
  const options = Object.fromEntries([[args[0], args[1]], [args[2], args[3]]]);
  const evidenceRoot = await realpath(options['--evidence']);
  const agentPath = await realpath(options['--audit-agent']);
  const scorerPath = await realpath(resolve(dirname(agentPath), '../../core/compliance-scorer.js'));
  const manifestPath = await realpath(resolve(evidenceRoot, 'artifact-manifest.json'));
  if (!manifestPath.startsWith(evidenceRoot + sep)) throw new Error('Manifest must be inside the evidence directory');
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  if (!Array.isArray(manifest.evidence) || manifest.evidence.length === 0) throw new Error('artifact-manifest.json requires a nonempty evidence array');
  const seen = new Set();
  for (const item of manifest.evidence) {
    if (!item || typeof item.path !== 'string' || !item.path || isAbsolute(item.path) || item.path.split(/[\\/]/).includes('..') || !/^[a-f0-9]{64}$/i.test(item.sha256 ?? '') || seen.has(item.path) || item.path === 'audit.json') throw new Error('Invalid or duplicate evidence entry');
    seen.add(item.path);
  }
  for (const required of ['campaign.json', 'source-manifest.json']) if (!seen.has(required)) throw new Error(`Manifest must include ${required}`);
  const before = { auditAgent: digest(await readFile(agentPath)), complianceScorer: digest(await readFile(scorerPath)) };
  const { AuditAgent } = await import(pathToFileURL(agentPath).href);
  if (typeof AuditAgent !== 'function' || typeof AuditAgent.prototype.auditAssignments !== 'function') throw new Error('Selected AuditAgent lacks auditAssignments');
  const result = await new AuditAgent({ rootDir: evidenceRoot }).auditAssignments([{ id: 'nvidia-dense-challenge', owner: 'challenge', evidence: manifest.evidence }]);
  const after = { auditAgent: digest(await readFile(agentPath)), complianceScorer: digest(await readFile(scorerPath)) };
  if (before.auditAgent !== after.auditAgent || before.complianceScorer !== after.complianceScorer) throw new Error('Audit source changed during invocation');
  const report = {
    scope: 'ARTIFACT_INTEGRITY_ONLY',
    authorityBinding: 'CALLER_SELECTED_UNVERIFIED',
    hashProvenance: 'MANIFEST_SELF_RECORDED_NOT_INDEPENDENTLY_ANCHORED',
    sourceHashes: { auditAgent: { path: agentPath, sha256: before.auditAgent }, complianceScorer: { path: scorerPath, sha256: before.complianceScorer } },
    artifactManifestSha256: digest(manifestBytes),
    auditResult: result,
    productionAccepted: false,
    unresolved: ['TRUSTED_SOURCE_PIN', 'GPU_EXECUTION_INDEPENDENT_VERIFICATION', 'FORMULA_RUNTIME_FABRIC_VERITAS_RECEIPT_BINDING', 'LEEWAY80_MATCHED_DENSE_ADAPTER', 'SURVIVABILITY_ENTERPRISE_EVIDENCE'],
    inventory: 'K2-certification-inventory.md'
  };
  await writeFile(resolve(evidenceRoot, 'audit.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  if (!Array.isArray(result.assignments) || result.assignments.length !== 1 || result.assignments[0].status !== 'SOURCE_VERIFIED_EXECUTION_UNVERIFIED' || result.assignments[0].productionAccepted !== false) process.exitCode = 1;
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
