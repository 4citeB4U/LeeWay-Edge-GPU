/**
 * LEEWAY UNIFIED COMPUTE RUNTIME (LUCR)
 * Layer Engine Core (Execution OS Kernel)
 * 
 * Enforces the Execution Pipeline using a Dual Middleware approach:
 * 1. CONTROL PIPELINE (Blocking, PRE-CHECK)
 * 2. FLOW PIPELINE (Non-Blocking, PRE-EXECUTION TRANSFORM)
 * 3. EXECUTION
 * 4. POST-EXECUTION (Resilience & Cleanup)
 */

class LayerContext {
    constructor(task) {
        this.task = task;
        this.rejected = false;
        this.rejectReason = null;
        this.telemetry = [];
        this.recovered = false;
        // Allows systems to pass dependency execution state around
        this.runtimeDependencies = task.dependencies || []; 
    }

    log(message) {
        this.telemetry.push(`[${Date.now()}] ${message}`);
    }

    reject(reason) {
        this.rejected = true;
        this.rejectReason = reason;
        this.log(`REJECTED: ${reason}`);
    }
}

class LayerEngine {
    constructor() {
        this.controlPipeline = [];
        this.flowPipeline = [];
        this.postExecutionPipeline = [];
        this.schedulerLayer = null; // Special Hybrid Tier
    }

    // Must return false if task is rejected
    async _runControlPipeline(ctx) {
        for (const layer of this.controlPipeline) {
            await layer.process(ctx);
            if (ctx.rejected) {
                return false;
            }
        }
        return true;
    }

    // Mutates and prepares the graph/task structure without blocking
    async _runFlowPipeline(ctx) {
        for (const layer of this.flowPipeline) {
            await layer.process(ctx);
        }
    }

    // Run cleanups and crash survivability (Resilience)
    async _runPostExecution(ctx, result, error) {
        for (const layer of this.postExecutionPipeline) {
            await layer.process(ctx, result, error);
        }
    }

    /**
     * @param {Object} layer The layer instance exposing .process()
     * @param {string} type 'control', 'flow', 'post', 'scheduler'
     */
    installLayer(layer, type) {
        switch (type) {
            case 'control':
                this.controlPipeline.push(layer);
                break;
            case 'flow':
                this.flowPipeline.push(layer);
                break;
            case 'post':
                this.postExecutionPipeline.push(layer);
                break;
            case 'scheduler':
                this.schedulerLayer = layer;
                break;
            default:
                throw new Error(`Invalid layer type: ${type}`);
        }
    }

    /**
     * Full OS execution pipeline. 
     */
    async submitTask(task, executionEngineFn) {
        const ctx = new LayerContext(task);
        ctx.log("Task entering LEEWAY execution kernel.");

        // PIPELINE PHASE 1: Control (Blocking Rules)
        // LEL-10 (Sovereign), LEL-4 (Capability), LEL-6 (Memory Pre-check), LEL-8 (Backpressure)
        const approved = await this._runControlPipeline(ctx);
        
        if (!approved) {
            return this._handleRejection(ctx);
        }

        // PIPELINE PHASE 2: Scheduling
        // LEL-3 (Scheduler) delays or yields execution until ready
        if (this.schedulerLayer) {
            ctx.log("Yielding to Scheduler Layer.");
            await this.schedulerLayer.process(ctx);
        }

        // PIPELINE PHASE 3: Flow (Transformation)
        // LEL-11 (Graph), LEL-1 (Density), LEL-2 (Locality), LEL-7 (Async)
        ctx.log("Transforming task via Flow Pipeline.");
        await this._runFlowPipeline(ctx);

        // PIPELINE PHASE 4: Execute
        ctx.log(`Sending to Execution Engine [${ctx.task.targetEngine || 'UNKNOWN'}]`);
        let result = null;
        let executionError = null;

        try {
            // Task has been mutated efficiently. Execute via the designated target engine.
            result = await executionEngineFn(ctx.task);
            ctx.log("Execution successful.");
        } catch (err) {
            executionError = err;
            ctx.log(`Execution failed: ${err.message}`);
        }

        // PIPELINE PHASE 5: Post-Execute
        // LEL-9 (Lifecycle), LEL-5 (Resilience)
        await this._runPostExecution(ctx, result, executionError);

        // If an error still persists after Resilience layer attempted a fix...
        if (executionError && !ctx.recovered) {
            throw new Error(`LUCR Fatal Execution Fault: ${executionError.message}`);
        }

        return {
            status: "SUCCESS",
            result: ctx.recovered ? ctx.recoveredResult : result,
            telemetry: ctx.telemetry
        };
    }

    _handleRejection(ctx) {
        console.warn(`[LUCR KERNEL REJECTION] Task ${ctx.task.id || 'N/A'}: ${ctx.rejectReason}`);
        return {
            status: "REJECTED",
            reason: ctx.rejectReason,
            telemetry: ctx.telemetry
        };
    }
}

export { LayerEngine, LayerContext };
