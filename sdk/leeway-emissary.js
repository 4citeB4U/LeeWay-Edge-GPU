/*
LEEWAY HEADER — DO NOT REMOVE
REGION: SDK.EMISSARY
TAG: SDK.LEEWAY.EMISSARY.LINK
5WH:
  WHAT = LeeWay Emissary — Thin Proxy Agent Client
  WHY = Allows developers to project Agent Lee into their apps without local AI overhead
  WHO = LeeWay Innovations
*/

/**
 * The LeeWay Emissary Bridge
 * 
 * Drop this file into your project to manifest a Sovereign Agent.
 * Connects to the local/remote Agent Lee Hub.
 */
class LeewayEmissary {
  constructor(options = {}) {
    this.hubUrl = options.hubUrl || "ws://localhost:8080";
    this.agentId = options.agentId || "general";
    this.ws = null;
  }

  /**
   * Awakening: Establishing the bridge to the Hub.
   */
  async awaken() {
    console.log(`📡 [EMISSARY] Awakening ${this.agentId}... Connecting to Hub at ${this.hubUrl}`);
    
    return new Promise((resolve, reject) => {
      // In a browser or Node context, use WebSocket
      const WS = (typeof window !== 'undefined') ? window.WebSocket : require('ws');
      
      this.ws = new WS(this.hubUrl);

      this.ws.onopen = () => {
        console.log("✅ [EMISSARY] Sovereign Bridge established.");
        this.ws.send(JSON.stringify({ type: "handshake", agentId: this.agentId }));
        resolve();
      };

      this.ws.onerror = (err) => {
        console.error("❌ [EMISSARY] Bridge failure:", err);
        reject(err);
      };

      this.ws.onmessage = (msg) => this._onMessage(msg);
    });
  }

  /**
   * Manifest a task within the host application.
   */
  async execute(intent) {
    if (!this.ws) throw new Error("Emissary is not awakened.");
    
    console.log(`🧠 [EMISSARY] Requesting task: "${intent}"`);
    this.ws.send(JSON.stringify({ type: "execute", intent }));
  }

  _onMessage(msg) {
    const data = JSON.parse(msg.data);
    
    if (data.type === "toolCall") {
      console.log(`🛠️ [HUB_REQUEST] Hub requested tool execution: ${data.tool}`);
      // The developer can implement tool handlers here
      this._handleTool(data);
    }

    if (data.type === "result") {
      console.log(`📖 [HUB_REPLY] Agent result:`, data.content);
    }
  }

  _handleTool(data) {
    // Standard tool execution layer
    // This allows the Hub to "Body-Snatch" the local environment securely
  }
}

// Export for Node or attach to Window for Browser
if (typeof module !== 'undefined') module.exports = LeewayEmissary;
else window.LeewayEmissary = LeewayEmissary;
