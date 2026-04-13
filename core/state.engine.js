/**
 * LEEWAY DISTRIBUTED STATE SYNC (LDSS)
 * Event-sourcing based state synchronization fabric
 */
export class StateEngine {
  constructor(trustEngine) {
    this.trustEngine = trustEngine;
    this.eventLog = [];
    this.state = {};
    this.versionVector = new Map();
  }

  appendEvent(event) {
    if (!this.eventLog.find(e => e.eventId === event.eventId)) {
      this.eventLog.push(event);
      this._applyEvent(event);
      
      const count = this.versionVector.get(event.nodeId) || 0;
      this.versionVector.set(event.nodeId, count + 1);
    }
  }

  getSince(timestamp) {
    return this.eventLog.filter(e => e.timestamp > timestamp);
  }

  async mergeIncoming(events) {
    for (const evt of events) {
      if (!this.trustEngine.isTrusted(evt.nodeId)) continue;
      
      const nodeRecord = this.trustEngine.trusted.get(evt.nodeId);
      const isVerified = await this.trustEngine.verifyMessage(nodeRecord.publicKey, evt.payload, evt.signature);
      
      if (isVerified) {
        this.appendEvent(evt);
      } else {
        nodeRecord.invalidSignatures++;
        // Fault + Malicious Handling implementation
        if (nodeRecord.invalidSignatures > 3) {
          console.warn(`[LDSS KERNEL] Banning malicious node: ${evt.nodeId}`);
          this.trustEngine.trusted.delete(evt.nodeId);
        }
      }
    }
  }

  _applyEvent(evt) {
    // Conflict resolution via 'Last Write Wins' applied naturally through event order mapping
    if (evt.type === "TASK_COMPLETED") {
      this.state[evt.payload.taskId] = evt.payload.result;
    }
  }

  createSnapshot() {
    return {
      snapshotId: `snap_${Date.now()}`,
      state: JSON.parse(JSON.stringify(this.state)),
      lastEventId: this.eventLog[this.eventLog.length - 1]?.eventId || null
    };
  }

  loadSnapshot(snapshot) {
    this.state = JSON.parse(JSON.stringify(snapshot.state));
    // Implementation would skip pushing already present events
  }
}
