/**
 * HYBRID DISPATCHER
 * Routes tasks to the optimal hardware backend natively.
 */
export class HybridDispatcher {
  constructor({ webgpu, webgl, ml, cpu }) {
    this.webgpu = webgpu;
    this.webgl = webgl;
    this.ml = ml;
    this.cpu = cpu;
  }

  async dispatch(task, ctx) {
    const path = this._selectPath(task, ctx);

    ctx.executionPath = path;

    switch (path) {
      case "WEBGPU":
        return this.webgpu.run(task, ctx);
      case "WEBGL":
        return this.webgl.run(task, ctx);
      case "ML":
        return this.ml.run(task, ctx);
      case "CPU":
      default:
        return this.cpu.run(task, ctx);
    }
  }

  _selectPath(task, ctx) {
    if (task.type === "AI_INFERENCE" && ctx.capability === "WEBGPU") {
      return "ML";
    }

    if (task.type === "COMPUTE") {
      if (ctx.capability === "WEBGPU") return "WEBGPU";
      if (ctx.capability === "WEBGL") return "WEBGL";
    }

    if (task.type === "RENDER") {
      return ctx.capability === "WEBGPU" ? "WEBGPU" : "WEBGL";
    }

    return "CPU";
  }
}
