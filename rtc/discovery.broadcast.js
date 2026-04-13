export class DiscoveryProtocol {
  constructor(rtc, nodeId, capabilities) {
    this.rtc = rtc;
    this.nodeId = nodeId;
    this.capabilities = capabilities;
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => {
      this.rtc.send({
        channel: "rtc://discovery",
        payload: {
          nodeId: this.nodeId,
          capabilities: this.capabilities,
          timestamp: Date.now()
        }
      });
    }, 2000);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}
