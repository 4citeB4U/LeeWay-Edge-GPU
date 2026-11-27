# G19 Samsung Adreno Vulkan deterministic compute probe

Status: **SOURCE_STAGED / NOT_BUILT / NOT_EXECUTED**. This source does not qualify LeeWay-controlled inference or an OS-native LeeWay adapter.

- `shader.comp`: 256 uint32 lanes, each `(i*17u)^0x5A5A1234u`.
- `main.cpp`: enumerate Vulkan GPUs, select compute queue, create storage buffer/pipeline, dispatch 4 x 64 lanes, fence and readback, compare independent host reference, emit physical GPU name/vendor/device and mismatch count. Return 0 only with zero mismatches, 2 for mismatches, 3 for errors.
- `CMakeLists.txt`: Android NDK target only, Vulkan library required.
- `source-contract.test.mjs`: limited static source checks, NOT native compilation/execution evidence.

## Prerequisites and bounded execution plan

Use an owner-approved Android NDK, CMake, and GLSL-to-SPIR-V shader compiler (`glslangValidator`). Compile `shader.comp` to `shader.spv`; build `main.cpp` for Android `arm64-v8a` using the NDK CMake toolchain and Android Vulkan loader. Validate `shader.spv` as SPIR-V before use. Do not mistake a Windows Vulkan run for a Samsung result.

Before writing to the connected phone, obtain the owner's approval for the specific transient probe transfer/execution. Transfer only the bounded test binary and shader into an isolated temporary directory, run with stdout/stderr captured, and clean up with owner approval. Never alter `industries.leeway.pocket`, ADB pairing, drivers, system partitions or graphics settings. Collect binary/shader hashes, exact GPU vendor/device, process exit code, 256 values read back/mismatch count, timestamps, and independent evidence. Device-local runtime and model inference remain separate acceptance gates.

Current host probe did not locate clang, glslangValidator, CMake or Ninja on PATH or an NDK in the default Android SDK directory. No native build, transfer or device execution was performed.

<!-- LEEWAY UNIVERSAL FORMULA GOVERNANCE BEGIN -->

# LeeWay Universal Formula Governance

Authority: Creator and LeeWay Standards.
Formula identity: LEEWAY-FORMULA-v1.0.

The canonical LeeWay Formula is mandatory throughout
the entire LeeWay ecosystem.

Every current and future application, capability,
agent, worker, employee, model, provider, adapter,
automation and integration inherits this requirement.

All applicable interactions, responses, decisions,
actions, revisions, executions, computations, model
inferences, resource allocations, information transfers,
memory operations, storage operations and deployments
must consume the canonical Formula through their
authorized and qualified domain contracts.

Formula availability, documentation, configuration,
health and historical results do not constitute actual
Formula consumption for a new operation.

Recover relevant authorized memory before substantive
work. Preserve identity, provenance, Formula integrity,
authorization, original receipts and verified learning.

Never invent observations, adapter mappings, mathematical
results, execution evidence or independent verification.

No application may bypass applicable Formula governance
by dispatching directly to a provider.

Every new application and capability must demonstrate
applicable Formula consumption before production admission.

Preserve the existing authority hierarchy:

Creator > Standards > Root of Trust > Runtime Fabric >
Agent Lee > Harness > Formula > skills/models/tools >
execution > Veritas > Receipt Authority > Learning Ledger.

Execute the complete engineering loop:

INVESTIGATE > DIAGNOSE > PLAN > IMPLEMENT > TEST >
VALIDATE > REPAIR > RETEST > VERIFY > EVIDENCE >
CHECKPOINT > CONTINUE.

Documentation compliance does not establish executable
enforcement or production admission.

<!-- LEEWAY UNIVERSAL FORMULA GOVERNANCE END -->
