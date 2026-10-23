# Leeway Edge GPU — PyTorch integration candidate

Source base: GPU PR #11, `e7b61d4b6bbcb569ab7ed2f4f2c6960b209086be`.
Creator accepted the branded `torch.leeway` / `device="leeway"` direction with
physical GPU execution and no silent CPU compute fallback.

## Implemented source

`pytorch/` contains the `leeway-edge-gpu` Python package and a native Windows
D3D12 PrivateUse1 adapter. The public name is **Leeway Edge GPU**. The physical
adapter/vendor is separately reported. Tensor storage is a default-heap D3D12
resource; upload/readback buffers are host transfer staging only.

The initial operator set is bounded float32 fill, rank-2 matmul, same-shape
addition/multiplication, ReLU and transfers. The tiled matrix shader adapts the
existing repository's WGSL algorithm to rectangular HLSL with full participation
at tile barriers. Unsupported operations fail; no CPU fallback is registered.
Vulkan, Metal, autograd, GPU RNG, torch.compile, general transformer compatibility,
and multi-device scheduling are not implemented in this adapter.

## Workstation observations

- Authenticated GitHub access to `4citeB4U/LeeWay-Edge-GPU` succeeded with ADMIN
  permission. Earlier sandbox folder failures did not establish a GitHub outage.
- The current source was recovered into a separate writable checkout, preserving
  the existing E-drive source and existing PR branch.
- Installed Python 3.13.13, PyTorch 2.12.0+cpu, MSVC 14.44 and Windows SDK 26100
  were used. A CPU-distributed PyTorch installation can load an external device
  extension; it does not turn the extension's GPU kernels into CPU calculations.
- Native compilation/linking succeeded.
- Local discovery/error-handling suite: four passed; eight hardware checks skipped.
- The required-GPU test attempt failed before extension initialization:
  `DLL load failed while importing _C: An Application Control policy has blocked this file.`
- Windows Application Control was preserved. No policy, key, signer, enrollment,
  device driver or system setting was changed to load the module.

Physical GPU tensor execution/readback is therefore **BLOCKED / UNVERIFIED** on
this host. Source code and successful compilation do not establish kernel
correctness. The standard suite explicitly skips hardware checks when the
adapter cannot load; `LEEWAY_REQUIRE_GPU=1` makes that state a failure.

## Acceptance and promotion

The first Windows hosted runs exposed Microsoft Basic Render Driver, vendor
`0x1414`, device `0x008c`, with DXGI flags that did not identify it as software.
Numerical checks ran through that renderer and the process subsequently returned
exit code 1; those runs are not physical GPU proof. The selector now rejects that
known software identity even when its flags are zero, with a native regression
check. The physical-GPU checks must skip on this hosted software renderer.
Shutdown behavior on actual hardware remains part of required qualification.

The test suite compares rectangular partial-tile matmul, GPU fill, elementwise
operations, explicit copies and resource release with CPU reference results. It
also checks unsupported-operator, dtype, stride, shape and budget failures.
Reference calculation is verification; it is not a fallback execution route.

GitHub CI compiles and requires native registration and both HLSL shader entrypoints
to compile on a Windows runner, and checks unavailable discovery on Linux. Hardware tests are conditional on a
real physical adapter. A green hosted workflow with skipped hardware tests must
not be described as GPU execution proof.

Production admission remains governed by the existing G39 matrix and Runtime
Fabric PR #77. This candidate neither enables production dispatch nor grants
authority to Formula policy, Veritas signing or ledger appends. No Formula task
evaluation or canonical GPU receipt is claimed by this work.
