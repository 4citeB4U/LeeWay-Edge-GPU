/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.INTEGRITY
TAG: AI.AGENT.CIRCULAR.DEPENDENCY

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=refresh-cw

5WH:
WHAT = Circular dependency agent — detects circular imports and risky graph patterns
WHY = Circular imports cause module initialization failures and memory leaks
WHO = Rapid Web Development
WHERE = src/agents/integrity/circular-dependency-agent.js
WHEN = 2026
HOW = DFS cycle detection on the dependency graph produced by dependency-graph-agent

AGENTS:
CIRCULAR
DEPENDENCY

LICENSE:
MIT
*/

/**
 * CircularDependencyAgent detects cycles in a dependency graph.
 */
export class CircularDependencyAgent {
  /**
   * Find all circular dependency cycles in a graph.
   *
   * @param {object} graph - Adjacency map from DependencyGraphAgent
   * @returns {{ cycles: string[][], hasCycles: boolean }}
   */
  findCycles(graph) {
    const visited = new Set();
    const inStack = new Set();
    const cycles = [];

    const dfs = (node, path) => {
      if (inStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart).concat(node));
        return;
      }
      if (visited.has(node)) return;

      visited.add(node);
      inStack.add(node);
      path.push(node);

      for (const dep of (graph[node]?.imports || [])) {
        dfs(dep, [...path]);
      }

      inStack.delete(node);
    };

    for (const node of Object.keys(graph)) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    const uniqueCycles = cycles.filter((cycle, i) =>
      cycles.findIndex(c => c.join() === cycle.join()) === i
    );

    return { cycles: uniqueCycles, hasCycles: uniqueCycles.length > 0 };
  }

  /**
   * Describe a cycle in human-readable form.
   *
   * @param {string[]} cycle
   * @returns {string}
   */
  describeCycle(cycle) {
    return cycle.join(' → ');
  }
}
