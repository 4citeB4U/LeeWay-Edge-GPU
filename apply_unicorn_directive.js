const fs = require('fs');
const path = require('path');

// 1. Generate LWA_Agent_Registry (Manifest_Ledger.sql & seed.json)
const SCRIPT_DIR = path.join(__dirname, 'scripts');
if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR);

const REGISTRY_FILE_SQL = path.join(SCRIPT_DIR, 'LWA_Agent_Registry_Manifest_Ledger.sql');
const REGISTRY_FILE_JSON = path.join(SCRIPT_DIR, 'LWA_Agent_Registry_Seed_10k.json');

console.log('Generating LWA_Agent_Registry with 1,000,000 entries...');

const agentsClasses = [
    { prefix: 'NbTi_Trace_Seg', duty: '["conduct_nV_with_zero_resistance", "monitor_thermal_leak"]', limit: '0.001_Ohm_Max' },
    { prefix: 'Josephson_Junction_Agent', duty: '["tunnel_electron_pairs", "maintain_supercurrent"]', limit: '20mK' },
    { prefix: 'Cryo_Thermal_Bridge_Agent', duty: '["reject_phonon_noise", "conduct_heat_away"]', limit: '4K' },
    { prefix: 'SQUID_Amp_Stage_Agent', duty: '["convert_magnetic_flux_to_voltage"]', limit: '100nV_to_10uV' },
    { prefix: 'HEMT_Preamp_Agent', duty: '["gain_20dB_GaAs"]', limit: '0.8dB_Noise_Max' },
    { prefix: 'ADC_Sampler_Agent', duty: '["sample_1MSps", "anti_alias_filter"]', limit: '1ns_Jitter_Max' },
    { prefix: 'FPGA_Logic_Gate_Agent', duty: '["AND_logic", "OR_logic", "Clock_Sync_1GHz"]', limit: '1V_Core' },
    { prefix: 'PCIe_Transfer_Agent', duty: '["Gen4_x8_transfer", "DMA_buffer"]', limit: '16GBps' },
    { prefix: 'GPU_VRAM_Address_Agent', duty: '["buffer_frame_data", "allocate_shader_memory"]', limit: 'GDDR6X' },
    { prefix: 'Pixel_Shader_Agent', duty: '["fidelity_color_map"]', limit: 'Sub_1ms_Render' },
    { prefix: 'LCD_Pixel_Emitter_Agent', duty: '["excite_phosphor", "emit_photon_at_specific_wavelength"]', limit: '650nm_Wavelength' }
];

const ws = fs.createWriteStream(REGISTRY_FILE_SQL);
ws.write("-- LWA-DIRECTIVE: UNICORN_SYSTEM_INTEGRATION\n");
ws.write("-- Planetary-Scale Isomorphic Motherboard (1,000,000 Agents)\n");
ws.write("CREATE TABLE IF NOT EXISTS LWA_Agent_Registry (\n");
ws.write("  Agent_ID VARCHAR(64) PRIMARY KEY,\n");
ws.write("  Hardware_Name VARCHAR(128),\n");
ws.write("  Locked_Duties JSON,\n");
ws.write("  Signal_Type VARCHAR(64),\n");
ws.write("  Region_Tag VARCHAR(64),\n");
ws.write("  Neighbor_ID VARCHAR(64),\n");
ws.write("  Physical_Limit VARCHAR(128)\n");
ws.write(");\n\n");

let idCounter = 111; // 1-110 are existing
const TOTAL_DOMAINS = 1000000;
let jsonSeed = [];

ws.write("INSERT INTO LWA_Agent_Registry (Agent_ID, Hardware_Name, Locked_Duties, Signal_Type, Region_Tag, Neighbor_ID, Physical_Limit) VALUES \n");

for (let i = idCounter; i <= TOTAL_DOMAINS; i++) {
    const classType = agentsClasses[i % agentsClasses.length];
    const agentId = "LWA-" + String(i).padStart(6, '0');
    const nextAgentId = "LWA-" + String(i + 1).padStart(6, '0');
    const name = classType.prefix + "_" + i;
    const signal = (i < 500000) ? 'Analog/Atomic' : 'Digital/Compute';
    const region = (i < 500000) ? 'L1_Quantum_Fabric' : 'L7_Execution_Die';

    let value = "('" + agentId + "', '" + name + "', '" + classType.duty + "', '" + signal + "', '" + region + "', '" + nextAgentId + "', '" + classType.limit + "')";
    if (i === TOTAL_DOMAINS) {
        ws.write(value + ";\n");
    } else {
        if (i % 10000 === 0) {
            ws.write(value + ";\nINSERT INTO LWA_Agent_Registry (Agent_ID, Hardware_Name, Locked_Duties, Signal_Type, Region_Tag, Neighbor_ID, Physical_Limit) VALUES \n");
        } else {
            ws.write(value + ",\n");
        }
    }

    if (i <= 10110) { // First 10,000 seed
        jsonSeed.push({
            Agent_ID: agentId,
            Hardware_Name: name,
            Locked_Duties: JSON.parse(classType.duty),
            Signal_Type: signal,
            Region_Tag: region,
            Neighbor_ID: nextAgentId,
            Physical_Limit: classType.limit
        });
    }
}
ws.end();
console.log("SQL ledger with 1,000,000 micro-agents generated at " + REGISTRY_FILE_SQL);

fs.writeFileSync(REGISTRY_FILE_JSON, JSON.stringify(jsonSeed, null, 2));
console.log("JSON seed of 10,000 micro-agents generated at " + REGISTRY_FILE_JSON);

// 2. Bind the existing 110 Sovereign Agents
const SKILLS_DIR = path.join(__dirname, 'agents', 'skills');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedSkills = 0;

if (fs.existsSync(SKILLS_DIR)) {
    walkDir(SKILLS_DIR, function(filePath) {
        if (filePath.endsWith('.md')) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (!content.includes('self.physical_binding =')) {
                const regionMatches = content.match(/REGION: (.+)/);
                const region = regionMatches ? regionMatches[1].trim() : 'L8_Telecommunication_Orchestrator';
                
                const injection = "\n\n> **PHYSICAL ISOMORPHISM BINDING:**\n> `self.physical_binding = [" + region + "]`\n> *Enforced under LWA-DIRECTIVE: UNICORN_SYSTEM_INTEGRATION*\n";
                
                fs.writeFileSync(filePath, content + injection);
                modifiedSkills++;
            }
        }
    });
}

console.log("Successfully bound " + modifiedSkills + " Sovereign Agent skills to physical regions.");
