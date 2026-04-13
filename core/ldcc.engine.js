export class DistributedClusterCore {
  constructor(registry, rtc) {
    this.registry = registry;
    this.rtc = rtc;
    this.tasks = new Map();
  }

  scoreNode(node) {
    return (
      (node.capabilities.cpuCores || 1) * 2 +
      (node.capabilities.webgpu ? 10 : 0) -
      (node.currentLoad || 0)
    );
  }

  selectBestNode(task, nodes) {
    if (!nodes || nodes.length === 0) return null;
    return nodes
      .map(n => ({ node: n, score: this.scoreNode(n) }))
      .sort((a, b) => b.score - a.score)[0].node;
  }

  replicateTask(task, nodes) {
    const primary = this.selectBestNode(task, nodes);
    const backup = nodes.find(n => n.nodeId !== primary?.nodeId) || null;
    return { primary, backup };
  }

  dispatch(task) {
    const activeNodes = this.registry.getActive();
    if (activeNodes.length === 0) {
      throw new Error("No active nodes available in cluster.");
    }

    const { primary, backup } = this.replicateTask(task, activeNodes);
    
    if (!primary) throw new Error("Failed to assign primary node.");

    this.tasks.set(task.id, {
      ...task,
      status: "PENDING",
      assignedTo: primary.nodeId,
      backupNode: backup?.nodeId,
      retries: 0
    });

    // Dispatch to Primary Node
    this.rtc.send({ target: primary.nodeId, task });

    // Fault tolerance: failover check
    if (backup) {
      setTimeout(() => {
        const tracked = this.tasks.get(task.id);
        if (tracked && tracked.status !== "COMPLETE") {
          console.warn(`[LDCC] Primary timeout. Failing over to backup: ${backup.nodeId}`);
          tracked.status = "RUNNING_BACKUP";
          tracked.assignedTo = backup.nodeId;
          this.rtc.send({ target: backup.nodeId, task });
        }
      }, 3000);
    }
  }

  updateTaskStatus(taskId, status) {
    if (this.tasks.has(taskId)) {
      this.tasks.get(taskId).status = status;
    }
  }
}
