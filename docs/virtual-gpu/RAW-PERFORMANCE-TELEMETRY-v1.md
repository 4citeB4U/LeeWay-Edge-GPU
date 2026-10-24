# LeeWay GPU raw performance telemetry v1

The governed inference response includes `performanceTelemetry` alongside
`modelGraphTimings`. The provider validates both objects and includes them in
the result hash before returning the response. The benchmark records the raw
object for each successful run.

`performanceTelemetry.schema` is `leeway.gpu.raw-performance-telemetry.v1`.
Its scope string is intentionally explicit:

`LEEWAY_OPERATOR_ALLOCATOR_AND_MODEL_GRAPH_COUNTERS_NOT_PHYSICAL_HARDWARE_COUNTERS_OR_FORMULA_MAPPING`

| Field | What it measures | What it does not establish |
| --- | --- | --- |
| `modelWeightUploadBytes` | Bytes uploaded for the model weight tensors read by this inference session. | HBM read/write traffic, driver staging, or total host/device traffic. |
| `pagedEmbeddingUploadBytes` | Bytes written for paged per-layer embedding rows during this session. | Physical memory bus traffic. |
| `encodedDispatchCount` | LeeWay WGSL compute dispatches encoded by the successful model graph. | GPU occupancy, kernel duration, or hardware instruction count. |
| `trackedBufferLiveBytes` / `trackedBufferPeakBytes` | Sizes of buffers tracked by LeeWay's model operator allocator at the end and peak of the session. | Total physical VRAM, browser/driver allocations, or allocations outside that allocator. |
| `admittedBufferBudgetBytes` | The buffer budget admitted for this execution by the existing host lease. | A laptop-wide or device-wide memory limit. |
| `kvCacheReservedBytes` | Bytes reserved by the model graph's fixed KV-cache allocation plan. | Cache traffic, fragmentation, miss behavior, or eviction behavior. |
| `kvCacheCapacityTokens` | Context positions allocated by the model graph's KV-cache plan. | A benchmark-wide concurrency limit. |
| `kvCachePositionsProcessed` | Model token positions processed in the successful session. | Cache growth or reuse across requests. |

`modelGraphTimings` reports LeeWay model-load, prefill, and decode wall time.
The per-token `elapsedMs` includes orchestration and GPU completion/readback
time; it is not a hardware kernel timer. Client time-to-first-token remains
unmeasured because the current service response is non-streaming.

The benchmark keeps `formulaControllerCoverage.mappingState` at
`NOT_QUALIFIED`. Raw counters are evidence for future mapping and scale-set
qualification; they are not Formula inputs or controller scores. The current
instrumentation does not measure HBM bandwidth, stalls, batching, scheduler
queue depth, interconnect behavior, cache fragmentation, or eviction.
