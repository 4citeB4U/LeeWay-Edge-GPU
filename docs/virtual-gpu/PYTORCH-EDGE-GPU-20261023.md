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
- Native compilation/linking succeeded. An initial test attempt failed before initialization:
  `DLL load failed while importing _C: An Application Control policy has blocked this file.`
- After ordinary source repairs and rebuilding, the local test invocation loaded
  the module and used **NVIDIA GeForce RTX 5060 Laptop GPU**, vendor 4318, device
  11609, D3D12, with `software_adapter=false`. No policy, key, signer, enrollment,
  device driver or system setting was changed to load it. The earlier load error
  is retained as an observation, not a current permanent blocker.
- Final required-GPU run (`LEEWAY_REQUIRE_GPU=1`): **13 passed, 1 skipped**,
  process exit **0**. The skip is the unavailable-device branch. GPU checks
  include fill, rectangular partial-tile matmul/readback, zero-inner-dimension
  matmul, addition/multiplication/ReLU, copies, resource release, unsupported
  operator/dtype/stride/shape/budget/async failures, and clean child-process exit
  while a GPU tensor remains live.
- Main-process counters: **14 GPU dispatches**, 1,168 upload bytes, 10,548
  readback bytes, **0 remaining tracked tensor-allocation bytes**. Child-process
  allocations/dispatches are separate.

This establishes the bounded Windows GPU tensor path on that adapter. It does
not establish other hardware/platforms, throughput, large-model inference or
production governance. The standard suite explicitly skips hardware checks when
the adapter cannot load; `LEEWAY_REQUIRE_GPU=1` makes that state a failure.

Final local SHA-256 evidence (source bytes on this workstation):

| Artifact | SHA-256 |
| --- | --- |
| `pytorch/native/backend.cpp` | `8b9f8d7bb0c1f4e2ed74de9d2296d855152e8d4813f3f30854275141ff32cf60` |
| `pytorch/leeway_edge_gpu/__init__.py` | `943bd62fb15faef9552681338bfcdcb3cee6d5800b795c8ec6182df318d56fbd` |
| local `_C.cp313-win_amd64.pyd` | `1640936ec11cb9eb8513a8837bd15f36a9f88b43679e2ad00f05d1c668781c4d` |

The binary is a local build artifact, not a signed production release. No canonical
receipt or Learning Ledger entry is implied by this diagnostic evidence.

## Acceptance and promotion

The first Windows hosted runs exposed Microsoft Basic Render Driver, vendor
`0x1414`, device `0x008c`, with DXGI flags that did not identify it as software.
Numerical checks ran through that renderer and the process subsequently returned
exit code 1; those runs are not physical GPU proof. The selector now rejects that
known software identity even when its flags are zero, with a native regression
check. The physical-GPU checks must skip on this hosted software renderer.
The initial native runtime also returned exit code 1 after numerical tests.
The Python exit hook now releases D3D12 runtime objects before Windows DLL
process-detach; final parent/child process shutdown checks pass on the laptop GPU.

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
