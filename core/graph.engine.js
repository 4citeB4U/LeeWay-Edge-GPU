/**
 * LEL-X: GRAPH EXECUTION ENGINE
 * Resolves topology and executes fragmented nodes as a structured graph.
 */
export class GraphEngine {
  constructor({ pipeline }) {
    this.pipeline = pipeline;
  }

  /**
   * Execute a graph of operations
   */
  async runGraph(graph, context = {}) {
    const resolved = this._resolveDependencies(graph);

    for (const node of resolved) {
      await this.pipeline.submitTask({
        id: node.id,
        TAG: node.TAG,
        REGION: node.REGION,
        payload: node.payload,
        execute: node.execute,
        fallback: node.fallback,
        dependencies: node.dependencies
      });
    }
  }

  /**
   * Topological sort (dependency resolution)
   */
  _resolveDependencies(graph) {
    const visited = new Set();
    const result = [];

    function visit(node) {
      if (visited.has(node.id)) return;

      node.dependsOn?.forEach(dep => {
        const depNode = graph.find(n => n.id === dep);
        if (depNode) visit(depNode);
      });

      visited.add(node.id);
      result.push(node);
    }

    graph.forEach(visit);

    return result;
  }
}
