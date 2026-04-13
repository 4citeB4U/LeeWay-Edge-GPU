export class NodeRegistry {
  constructor() {
    this.nodes = new Map();
  }

  update(node) {
    this.nodes.set(node.nodeId, {
      ...node,
      lastSeen: Date.now(),
      currentLoad: node.currentLoad || 0
    });
  }

  getActive() {
    const now = Date.now();
    return [...this.nodes.values()].filter(n => now - n.lastSeen < 5000);
  }

  monitor() {
    // Heartbeat monitoring to drop dead nodes
    setInterval(() => {
      const now = Date.now();
      for (const [id, node] of this.nodes) {
        if (now - node.lastSeen > 5000) {
          this.nodes.delete(id);
        }
      }
    }, 2000);
  }
}
