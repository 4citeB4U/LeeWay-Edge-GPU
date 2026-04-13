import fs from 'fs/promises';
import path from 'path';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'agents', 'agents');
const coreDir = path.join(rootDir, 'agents', 'CORE');

const layers = {
    'L1_Perception': ['StreamingSTTAgent.ts', 'VisionAgent.ts', 'StreamingTTSAgent.ts'],
    'L2_Ingestion': ['RouterAgent.ts', 'Nexus.ts', 'Aria.ts'],
    'L3_Cognition': ['AdamCortex.ts', 'GabrielCortex.ts', 'LilyCortex.ts', 'Navigator', 'Atlas.ts', 'Nova.ts', 'Echo.ts'],
    'L4_Consensus': ['MarshalVerify.ts', 'Sovereign-Auditor', 'GuardAegis.ts'],
    'L5_Governance': ['Shield.ts', 'BrainSentinel.ts', 'LeewayStandardsAgent.ts', 'JanitorSentinel.ts', 'SafetyRedactionAgent.ts', 'sentinel_agent.py'],
    'L6_Execution': ['SyntaxForge.ts', 'BugHunterForge.ts', 'code_scout_agent.py', 'LiveConductorAgent.ts'],
    'L7_Memory': ['Sage.ts', 'ClerkArchive.ts', 'ScribeArchive.ts', 'LibrarianAegis.ts', 'archivist_agent.py', 'indexer.py'],
    'L8_Delivery': ['AgentLee.ts', 'AgentLeeBT.ts', 'Pixel.ts']
};

const defaultLayer = 'L8_Delivery';

const headerTemplate = (filename, layer) => `/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.${layer.split('_')[0]}
TAG: LEEWAY.CORE.${filename.toUpperCase().replace(/[^A-Z0-9]/g, '_')}

5WH:
WHAT = Core High-Level Agent component in the Sovereign Spine
WHY = Powers the ${layer.split('_')[1]} capabilities of the LeeWay ecosystem
WHO = LeeWay Innovations (By Leonard Jerome Lee)
WHERE = agents/CORE/${layer}/${filename}
WHEN = 2026
HOW = LeeWay-governed autonomous subsystem operation

LICENSE:
MIT
*/
`;

const pythonHeaderTemplate = (filename, layer) => `"""
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.${layer.split('_')[0]}
TAG: LEEWAY.CORE.${filename.toUpperCase().replace(/[^A-Z0-9]/g, '_')}

5WH:
WHAT = Core High-Level Agent component in the Sovereign Spine
WHY = Powers the ${layer.split('_')[1]} capabilities of the LeeWay ecosystem
WHO = LeeWay Innovations (By Leonard Jerome Lee)
WHERE = agents/CORE/${layer}/${filename}
WHEN = 2026
HOW = LeeWay-governed autonomous subsystem operation

LICENSE:
MIT
"""
`;

async function main() {
    console.log("Starting First Pulse Identity Injection...");

    // Create L1-L8 directories
    await fs.mkdir(coreDir, { recursive: true });
    for (const layer of Object.keys(layers)) {
        await fs.mkdir(path.join(coreDir, layer), { recursive: true });
    }

    try {
        const files = await fs.readdir(sourceDir);
        let count = 0;

        for (const file of files) {
            if (file.startsWith('.') || file.includes('__pycache__')) continue;

            const ext = path.extname(file);
            if (!['.ts', '.js', '.py', '.json'].includes(ext)) continue;

            let targetLayer = defaultLayer;
            for (const [layer, agents] of Object.entries(layers)) {
                if (agents.some(a => file.includes(a.replace('.ts', '').replace('.py','')))) {
                    targetLayer = layer;
                    break;
                }
            }

            const targetPath = path.join(coreDir, targetLayer, file);
            const sourcePath = path.join(sourceDir, file);

            // Read the content
            const stat = await fs.stat(sourcePath);
            if (stat.isDirectory()) continue;

            let content = await fs.readFile(sourcePath, 'utf8');

            // inject header if not already present
            if (!content.includes('LEEWAY HEADER')) {
                if (ext === '.py') {
                    content = pythonHeaderTemplate(file, targetLayer) + content;
                } else if (ext === '.ts' || ext === '.js') {
                    content = headerTemplate(file, targetLayer) + content;
                }
            }

            await fs.writeFile(targetPath, content, 'utf8');
            console.log("Pulsed and Woke up " + file + " into " + targetLayer);
            count++;
        }

        console.log("First Pulse complete. Awakened " + count + " agents under LeeWay standards.");
    } catch (e) {
        console.error("Pulse Failed:", e);
    }
}

main();
