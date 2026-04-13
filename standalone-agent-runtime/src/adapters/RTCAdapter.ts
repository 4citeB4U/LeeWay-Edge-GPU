import WebSocket from 'ws';
import { ExecutionContext, SkillExecutionRecord } from '../engine/ExecutionEngine';

export class RTCAdapter {
  private ws: WebSocket | null = null;
  private peerId: string | null = null;
  private roomName: string = 'leeway-main';
  private messageId: number = 0;
  private pending = new Map<number, { resolve: (d: any) => void; reject: (e: Error) => void }>();

  constructor(private signalingUrl: string, private apiKey: string) {}

  async connect() {
    console.log(`📡 [RTC] Connecting to Edge SFU: ${this.signalingUrl}`);
    
    // In a real scenario, we'd fetch the JWT token here first.
    // For the bridge, we'll connect and authenticate via the WS.
    this.ws = new WebSocket(`${this.signalingUrl}?apiKey=${this.apiKey}`);

    return new Promise<void>((resolve, reject) => {
      this.ws!.on('open', () => {
        console.log("📡 [RTC] Signaling connection established.");
        this._authenticate().then(resolve).catch(reject);
      });

      this.ws!.on('message', (data) => this._handleMessage(data));
      this.ws!.on('error', (err) => {
        console.error("📡 [RTC] WebSocket error:", err);
        reject(err);
      });
      this.ws!.on('close', () => {
        console.log("📡 [RTC] Signaling connection closed.");
      });
    });
  }

  private async _authenticate() {
    // Basic Auth RPC call as defined in LeeWay-Edge-RTC
    const response: any = await this.request('auth', { token: 'LOCAL_SERVICE_TOKEN' });
    this.peerId = response.peerId;
    
    await this.request('joinRoom', { roomId: this.roomName, rtpCapabilities: {} });
    console.log(`📡 [RTC] Joined room: ${this.roomName} as Peer: ${this.peerId}`);
  }

  private _handleMessage(data: WebSocket.Data) {
    const msg = JSON.parse(data.toString());

    if (msg.id !== undefined) {
      const pending = this.pending.get(msg.id);
      if (pending) {
        this.pending.delete(msg.id);
        if (msg.ok === false) pending.reject(new Error(msg.error));
        else pending.resolve(msg);
      }
      return;
    }

    // Handle Server-Push events (like Agent Commands from Hubert/Dispatcher)
    if (msg.type === 'agentCommand' || msg.type === 'remoteIntent') {
      console.log(`📡 [RTC] Received Remote Intent: ${msg.intent}`);
      // Goal Injection: This pushes the intent directly into the runtime's event loop
      if (this.onIntentReceived) this.onIntentReceived(msg.intent);
    }
  }

  // Hook for the Runtime to listen for remote tasks
  public onIntentReceived: ((intent: string) => void) | null = null;

  /**
   * Memory Pulse: Sends semantic summaries back to the Hub for backup.
   * Ensures sovereign learning is never lost.
   */
  async pulseMemory(summary: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    console.log("🧬 [RTC] Pulsing semantic memory to Federated Hub...");
    this.ws.send(JSON.stringify({ 
      type: 'memoryPulse', 
      payload: summary,
      timestamp: Date.now()
    }));
  }

  /**
   * Pushes a live execution log to the Global Edge Hub
   */
  async pushLog(record: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const event = {
      type: 'agentEvent',
      codename: 'LEE_SOVEREIGN',
      level: record.status === 'success' ? 'success' : 'info',
      msg: `[AGENT_CYCLE] ${record.intent}: ${record.status}`,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify({ type: 'pushEvent', event }));
  }
}

