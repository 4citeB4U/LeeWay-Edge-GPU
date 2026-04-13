/**
 * ----------------------------------------------------------------------------
 * 5W + H SYSTEM MANIFEST (LEEWAY STANDARDS)
 * ----------------------------------------------------------------------------
 * WHAT: LEEWAY RTC Bridge for WebGPU Fabric (Mediasoup Edge Adapter)
 * WHY: To bind the execution spine with real-time web communication via SFU
 * WHO: Creator: Leonard Lee | Leeway Innovations | A Leeway Industries Creation
 * WHERE: Cross-origin real-world binding to `LeeWay-Edge-RTC-main`
 * WHEN: Active on boot bridging 2-way real-world physical protocols
 * HOW: WebSocket Signalling Adapter mirroring the SFU RPC protocol
 * ----------------------------------------------------------------------------
 */

export class LeewayRTCBridge {
  constructor() {
    this.status = "OFFLINE";
    this.ws = null;
    this.agentRegistry = {};
    
    // SFU Config from LeeWay-Edge-RTC (Dynamic for Cloud Deployment)
    this.url = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'ws://localhost:3000/ws'
      : `wss://${window.location.hostname}/ws`; 
    this.room = 'leeway-main';
  }

  async connectToHive(apiKey = '-leeway23-edgegpu') {
    this.status = "CONNECTING [SFU_HANDSHAKE]";
    
    return new Promise((resolve) => {
      try {
        // Attempting to bridge to LeeWay-Edge-RTC mediasoup server under Leeway Innovation constraints
        this.ws = new WebSocket(`${this.url}?apiKey=${apiKey}`);
        
        this.ws.onopen = () => {
          this.status = "CONNECTED [HIVE_SYNCED]";
          this.broadcastTelemetry('LeeWay_NPC_System', 'info', 'WebGPU Execution Node Attached to Room: ' + this.room);
          resolve(true);
        };
        
        this.ws.onerror = (e) => {
          console.warn("[LEEWAY RTC] Hive connection unavailable. Failing over to localized isolated signaling governed by Leeway Standards.");
          this.status = "ISOLATED [NO_SFU]";
          resolve(false); 
        };
        
        this.ws.onmessage = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'newProducer' || msg.type === 'agentEvent') {
            console.log("[LEEWAY HIVE INBOUND]", msg);
          }
        };
      } catch (err) {
        this.status = "ISOLATED [NO_SFU]";
        resolve(false);
      }
    });
  }

  broadcastTelemetry(agentId, level, msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Broadcasting in the exact standard expected by LeeWay-Edge-RTC Store
      this.ws.send(JSON.stringify({
        type: 'agentEvent',
        codename: agentId.toUpperCase(),
        level: level,
        msg: msg
      }));
    } else {
      console.log(`[LOCAL SECURE LOG] \${agentId} (\${level}): \${msg}`);
    }
  }

  registerAgentProtocol(agentId, role) {
    this.agentRegistry[agentId] = { role, status: 'IDLE' };
  }
}

export const rtcBridge = new LeewayRTCBridge();
