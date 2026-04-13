const fs = require('fs');
const path = require('path');

/**
 * LEEWAY AGENT SCANNER
 * Recursively crawls the agent ecosystem and catalogs the 110+ agents
 * into a structured manifest aligned with Identity + Reputation (LIRS).
 */

function scanAgents(directory, fileList = []) {
  if (!fs.existsSync(directory)) return fileList;
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanAgents(fullPath, fileList);
    } else if (file.endsWith('.js') && !file.includes('.test.')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function generateRegistryManifest(basePath, outputPath) {
  const agentFiles = scanAgents(basePath);
  const registry = {
    generatedAt: Date.now(),
    totalAgents: agentFiles.length,
    agents: []
  };

  agentFiles.forEach(file => {
    // Extract domain/type structure from nested folder path
    const relativePath = path.relative(basePath, file);
    const parts = relativePath.split(path.sep);
    const type = parts.length > 1 ? parts[0].toUpperCase() : "GENERAL";
    const agentName = path.basename(file, '.js');
    
    registry.agents.push({
      id: `${type}-${agentName}-${Date.now().toString().slice(-6)}`,
      name: agentName,
      type: type,
      sourceConfig: relativePath,
      trustLevel: "PENDING_FINGERPRINT", // Awaiting LIRS initialization
      capabilities: []
    });
  });

  fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2), 'utf-8');
  console.log(`[LIRS INDEXER] Mapped ${registry.totalAgents} Agents to ${outputPath}`);
}

const agentsDir = path.resolve(__dirname, '../agents');
const outputManifest = path.resolve(__dirname, '../config/agent_manifest.json');

// Ensure config dir exists
if (!fs.existsSync(path.dirname(outputManifest))) {
  fs.mkdirSync(path.dirname(outputManifest));
}

generateRegistryManifest(agentsDir, outputManifest);
